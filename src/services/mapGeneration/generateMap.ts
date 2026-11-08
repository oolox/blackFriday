import type { GeneratedMap, MapParameters } from '../../types/map';
import type { Tile } from '../../types/tile';
import { ADJACENCY_GENERATOR_ID, generateAdjacencyLayout } from './generateAdjacencyLayout';
import { BSP_GENERATOR_ID, generateBspLayout } from './generateBspLayout';
import { rasterizeStruct, type StructStamp } from './rasterizeStruct';

export interface GenerateMapRequest {
  parameters: MapParameters;
  tiles: readonly Tile[];
  seed?: string;
  /** Catalog ids to stamp. Omitted actions use the first matching struct in catalog order. */
  stamp?: StructStamp;
  generatorId?: string;
}

export type GenerateMapResult = { ok: true; map: GeneratedMap } | { ok: false; errors: string[] };

export function generateMap(request: GenerateMapRequest): GenerateMapResult {
  const generatorId = request.generatorId ?? ADJACENCY_GENERATOR_ID;
  const layout =
    generatorId === ADJACENCY_GENERATOR_ID
      ? generateAdjacencyLayout(request.parameters, request.seed)
      : generatorId === BSP_GENERATOR_ID
        ? generateBspLayout(request.parameters, request.seed)
        : null;
  if (!layout) {
    return { ok: false, errors: [`unknown generator ${generatorId}`] };
  }
  if (!layout.ok) {
    return layout;
  }

  const stamped = rasterizeStruct(layout.layout, request.tiles, request.stamp);
  if (!stamped.ok) {
    return stamped;
  }

  return {
    ok: true,
    map: {
      parameters: layout.parameters,
      seed: layout.seed,
      generatorId: layout.generatorId,
      interiorTiles: stamped.grid.interiorTiles,
      layout: layout.layout,
      palette: stamped.grid.palette,
      cells: stamped.grid.cells,
    },
  };
}
