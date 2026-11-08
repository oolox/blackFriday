import type { BuildingType, OpeningKind } from '../../types/map';

/** Width divided by height. Commercial buildings run wider than residential ones. */
export function buildingAspect(buildingType: BuildingType): number {
  return buildingType === 'commercial' ? 1.6 : 1;
}

/** Residential cuts are single doors. Commercial cuts are open passages. */
export function openingKind(buildingType: BuildingType): OpeningKind {
  return buildingType === 'commercial' ? 'passage' : 'door';
}
