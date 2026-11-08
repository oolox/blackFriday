import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button/Button';
import { FullScreenModal } from '../../components/ui/FullScreenModal';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import type { BuildingType, MapParameters } from '../../types/map';
import styles from './GenerateMapDialog.module.css';

const TYPES: { value: BuildingType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

export interface GenerateMapDialogProps {
  open: boolean;
  canCancel: boolean;
  parameters: MapParameters;
  onGenerate: (parameters: MapParameters) => string | null;
  onCancel: () => void;
}

export function GenerateMapDialog({
  open,
  canCancel,
  parameters,
  onGenerate,
  onCancel,
}: GenerateMapDialogProps) {
  const [area, setArea] = useState(String(parameters.areaSquareFeet));
  const [rooms, setRooms] = useState(String(parameters.roomCount));
  const [buildingType, setBuildingType] = useState<BuildingType>(parameters.buildingType);
  const [error, setError] = useState<string | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setArea(String(parameters.areaSquareFeet));
      setRooms(String(parameters.roomCount));
      setBuildingType(parameters.buildingType);
      setError(null);
    }
    wasOpen.current = open;
  }, [open, parameters]);

  const generate = () => {
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
    const failure = onGenerate({ areaSquareFeet, roomCount, buildingType });
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
          generate();
        }}
      >
        <h2 className={styles.title}>Generate New Map</h2>
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
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.actions}>
          <Button variant="primary" type="submit">
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
