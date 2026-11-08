import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button/Button';
import { FullScreenModal } from '../../components/ui/FullScreenModal';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import type { LayoutTraceDelta } from '../../services/mapGeneration/generateLlmMap';
import type { BuildingType, MapParameters } from '../../types/map';
import { splitLogBlocks, type LogBlock } from './layoutLog';
import type { Planner } from './sandboxSessionContext';
import styles from './GenerateMapDialog.module.css';

const TYPES: { value: BuildingType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

export type MapGenerateRequest =
  { kind: 'algo'; parameters: MapParameters } | { kind: 'llm'; brief: string };

export interface GenerateMapDialogProps {
  open: boolean;
  canCancel: boolean;
  planner: Planner;
  parameters: MapParameters;
  onGenerate: (
    request: MapGenerateRequest,
    onTrace?: (delta: LayoutTraceDelta) => void,
  ) => string | null | Promise<string | null>;
  onCancel: () => void;
}

export function GenerateMapDialog({
  open,
  canCancel,
  planner,
  parameters,
  onGenerate,
  onCancel,
}: GenerateMapDialogProps) {
  const [area, setArea] = useState(String(parameters.areaSquareFeet));
  const [rooms, setRooms] = useState(String(parameters.roomCount));
  const [buildingType, setBuildingType] = useState<BuildingType>(parameters.buildingType);
  const [brief, setBrief] = useState('');
  const [trace, setTrace] = useState<LayoutTraceDelta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const wasOpen = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const stickToEnd = useRef(true);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setArea(String(parameters.areaSquareFeet));
      setRooms(String(parameters.roomCount));
      setBuildingType(parameters.buildingType);
      setTrace([]);
      setError(null);
      setPending(false);
    }
    wasOpen.current = open;
  }, [open, parameters]);

  useEffect(() => {
    const node = logRef.current;
    if (node && stickToEnd.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [trace]);

  const appendTrace = (delta: LayoutTraceDelta) => {
    setTrace((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.kind === delta.kind) {
        const next = prev.slice();
        next[next.length - 1] = { kind: last.kind, text: last.text + delta.text };
        return next;
      }
      return [...prev, delta];
    });
  };

  const generate = async () => {
    if (pending) {
      return;
    }
    if (planner === 'llm') {
      const text = brief.trim();
      if (text === '') {
        setError('Enter a brief');
        return;
      }
      setPending(true);
      setError(null);
      setTrace([]);
      stickToEnd.current = true;
      const failure = await onGenerate({ kind: 'llm', brief: text }, appendTrace);
      setPending(false);
      setError(failure);
      return;
    }
    const areaSquareFeet = Number(area);
    const roomCount = Number(rooms);
    if (!Number.isFinite(areaSquareFeet) || areaSquareFeet <= 0) {
      setError('Square footage must be a positive number');
      return;
    }
    if (!Number.isInteger(roomCount) || roomCount < 1) {
      setError('Rooms must be a positive integer');
      return;
    }
    setPending(true);
    setError(null);
    const failure = await onGenerate({
      kind: 'algo',
      parameters: { areaSquareFeet, roomCount, buildingType },
    });
    setPending(false);
    setError(failure);
  };

  return (
    <FullScreenModal
      open={open}
      onClose={onCancel}
      dismissible={canCancel}
      ariaLabel="Generate New Map"
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
        <h2 className={styles.title}>Generate New Map</h2>
        {planner === 'llm' ? (
          <>
            <label className={styles.field}>
              <span className={styles.label}>Brief</span>
              <textarea
                className={styles.brief}
                rows={4}
                value={brief}
                placeholder="A posh mansion with 8 bedrooms, 2 baths, and a study"
                onChange={(event) => setBrief(event.target.value)}
              />
            </label>
            <div
              className={styles.log}
              ref={logRef}
              aria-label="Model log"
              onScroll={() => {
                const node = logRef.current;
                if (!node) {
                  return;
                }
                stickToEnd.current = node.scrollHeight - node.scrollTop - node.clientHeight < 24;
              }}
            >
              {trace.length === 0 ? (
                <p className={styles.logEmpty}>{pending ? 'Generating…' : 'Model log'}</p>
              ) : (
                trace.map((part, partIndex) => (
                  <section key={`${part.kind}-${partIndex}`}>
                    <p className={styles.kind}>
                      {part.kind === 'reasoning' ? 'Thinking' : 'Reply'}
                    </p>
                    <LogBody blocks={splitLogBlocks(part.text)} />
                  </section>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <TextInput
              label="Square footage"
              type="number"
              min={1}
              value={area}
              onChange={(event) => setArea(event.target.value)}
            />
            <TextInput
              label="Rooms"
              type="number"
              min={1}
              step={1}
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
            />
            <label className={styles.field}>
              <span className={styles.label}>Type</span>
              <select
                className={styles.select}
                value={buildingType}
                onChange={(event) => setBuildingType(event.target.value as BuildingType)}
              >
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {error ? <p className={styles.error}>{error}</p> : null}
        {pending && planner !== 'llm' ? <p className={styles.status}>Generating…</p> : null}
        <div className={styles.actions}>
          <Button variant="primary" type="submit" disabled={pending}>
            Generate
          </Button>
          {canCancel ? (
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </FullScreenModal>
  );
}

function LogBody({ blocks }: { blocks: LogBlock[] }) {
  return blocks.map((block, index) => {
    if (block.type === 'text') {
      return (
        <p key={index} className={styles.prose}>
          {block.text}
        </p>
      );
    }
    const label = block.lang === '' ? 'code' : block.lang;
    return (
      <details
        key={`${index}-${block.closed ? 'done' : 'live'}`}
        className={styles.fence}
        {...(block.closed ? {} : { open: true })}
      >
        <summary>{label}</summary>
        <pre>{block.code}</pre>
      </details>
    );
  });
}
