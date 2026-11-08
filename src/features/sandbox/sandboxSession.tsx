import { useMemo, useRef, useState, type ReactNode } from 'react';
import { tiles } from '../../assets/tileSet/tileSet';
import { generateLlmMap, type LayoutTraceDelta } from '../../services/mapGeneration/generateLlmMap';
import { generateMap } from '../../services/mapGeneration/generateMap';
import type { GeneratedMap, MapParameters } from '../../types/map';
import { GenerateMapDialog, type MapGenerateRequest } from './GenerateMapDialog';
import {
  DEFAULT_MAP_PARAMETERS,
  SandboxSessionContext,
  type Planner,
  type SandboxSessionValue,
} from './sandboxSessionContext';

export function SandboxSessionProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<GeneratedMap | null>(null);
  const [parameters, setParameters] = useState<MapParameters>(DEFAULT_MAP_PARAMETERS);
  const [open, setOpen] = useState(true);
  const [seedCount, setSeedCount] = useState(0);
  const [planner, setPlanner] = useState<Planner>('llm');
  const abortRef = useRef<AbortController | null>(null);

  const value = useMemo<SandboxSessionValue>(
    () => ({
      map,
      planner,
      setPlanner,
      requestNew: () => setOpen(true),
    }),
    [map, planner],
  );

  const generate = async (
    request: MapGenerateRequest,
    onTrace?: (delta: LayoutTraceDelta) => void,
  ): Promise<string | null> => {
    const seed = `sandbox-${seedCount + 1}`;
    if (request.kind === 'llm') {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const result = await generateLlmMap({
        tiles,
        seed,
        brief: request.brief,
        signal: controller.signal,
        onTrace,
      });
      if (abortRef.current !== controller || controller.signal.aborted) {
        return null;
      }
      if (!result.ok) {
        return result.errors.join(' ');
      }
      setSeedCount((count) => count + 1);
      setParameters(result.map.parameters);
      setMap(result.map);
      setOpen(false);
      return null;
    }
    const result = generateMap({ parameters: request.parameters, tiles, seed });
    if (!result.ok) {
      return result.errors.join(' ');
    }
    setSeedCount((count) => count + 1);
    setParameters(request.parameters);
    setMap(result.map);
    setOpen(false);
    return null;
  };

  return (
    <SandboxSessionContext.Provider value={value}>
      {children}
      <GenerateMapDialog
        open={open}
        canCancel={map !== null}
        planner={planner}
        parameters={parameters}
        onGenerate={generate}
        onCancel={() => {
          abortRef.current?.abort();
          if (map) {
            setOpen(false);
          }
        }}
      />
    </SandboxSessionContext.Provider>
  );
}
