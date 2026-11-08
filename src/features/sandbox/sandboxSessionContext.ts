import { createContext, useContext } from 'react';
import type { GeneratedMap, MapParameters } from '../../types/map';

export const DEFAULT_MAP_PARAMETERS: MapParameters = {
  areaSquareFeet: 2000,
  roomCount: 4,
  buildingType: 'residential',
};

export type Planner = 'algo' | 'llm';

export interface SandboxSessionValue {
  map: GeneratedMap | null;
  planner: Planner;
  setPlanner: (planner: Planner) => void;
  requestNew: () => void;
}

export const SandboxSessionContext = createContext<SandboxSessionValue | null>(null);

export function useSandboxSession(): SandboxSessionValue {
  const session = useContext(SandboxSessionContext);
  if (!session) {
    throw new Error('useSandboxSession must be used within SandboxSessionProvider');
  }
  return session;
}
