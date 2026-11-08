import { useMemo, useState, type ReactNode } from 'react';
import { tiles } from '../../assets/tileSet/tileSet';
import { generateMap } from '../../services/mapGeneration/generateMap';
import type { GeneratedMap, MapParameters } from '../../types/map';
import { GenerateMapDialog } from './GenerateMapDialog';
import {
  DEFAULT_MAP_PARAMETERS,
  SandboxSessionContext,
  type SandboxSessionValue,
} from './sandboxSessionContext';

export function SandboxSessionProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<GeneratedMap | null>(null);
  const [parameters, setParameters] = useState<MapParameters>(DEFAULT_MAP_PARAMETERS);
  const [open, setOpen] = useState(true);
  const [seedCount, setSeedCount] = useState(0);

  const value = useMemo<SandboxSessionValue>(
    () => ({
      map,
      requestNew: () => setOpen(true),
    }),
    [map],
  );

  const generate = (next: MapParameters): string | null => {
    const seed = `sandbox-${seedCount + 1}`;
    const result = generateMap({ parameters: next, tiles, seed });
    if (!result.ok) {
      return result.errors.join(' ');
    }
    setSeedCount((count) => count + 1);
    setParameters(next);
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
        parameters={parameters}
        onGenerate={generate}
        onCancel={() => {
          if (map) {
            setOpen(false);
          }
        }}
      />
    </SandboxSessionContext.Provider>
  );
}
