import {
  MAP_MAX_EDGE,
  layoutIssues,
  type BuildingType,
  type MapLayout,
  type MapParameters,
  type Room,
  type SharedWall,
  type TileCoord,
} from '../../types/map';
import { buildingAspect } from './buildingTypeProfile';
import { areaTolerance, interiorTileTarget } from './generateBspLayout';
import { planOpenings } from './planOpenings';
import { randomSource, type RandomSource } from './randomSource';

export const ADJACENCY_GENERATOR_ID = 'adjacency-v1';

const MIN_ROOM = 3;

export interface AdjacencyLayoutSuccess {
  ok: true;
  generatorId: typeof ADJACENCY_GENERATOR_ID;
  parameters: MapParameters;
  seed: string;
  interiorTiles: number;
  layout: MapLayout;
}

export interface AdjacencyLayoutFailure {
  ok: false;
  errors: string[];
}

export type AdjacencyLayoutResult = AdjacencyLayoutSuccess | AdjacencyLayoutFailure;

interface Fit {
  width: number;
  height: number;
  depth: number;
  floor: number;
  score: number;
}

function parameterErrors(parameters: MapParameters): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(parameters.roomCount) || parameters.roomCount < 1) {
    errors.push('roomCount must be a positive integer');
  }
  if (!Number.isFinite(parameters.areaSquareFeet) || parameters.areaSquareFeet <= 0) {
    errors.push('areaSquareFeet must be a positive number');
  }
  return errors;
}

function shuffle<T>(items: readonly T[], rng: RandomSource): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = rng.int(0, index);
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}

function remember(ties: Fit[], bestScore: number, fit: Fit): { ties: Fit[]; bestScore: number } {
  if (fit.score < bestScore) {
    return { ties: [fit], bestScore: fit.score };
  }
  if (fit.score === bestScore) {
    ties.push(fit);
  }
  return { ties, bestScore };
}

/** Smallest floor a star of `roomCount` rooms can occupy. One room is just 3×3. */
function minimumFloor(roomCount: number): number {
  if (roomCount < 2) {
    return MIN_ROOM * MIN_ROOM;
  }
  const leaves = roomCount - 1;
  const span = MIN_ROOM * leaves + (leaves - 1);
  return leaves * MIN_ROOM * MIN_ROOM + span * MIN_ROOM;
}

function searchSingle(target: number, tolerance: number, aspect: number, maxEdge: number): Fit[] {
  let ties: Fit[] = [];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let width = MIN_ROOM; width <= maxEdge; width++) {
    if (width * MIN_ROOM > target + tolerance) {
      break;
    }
    for (let height = MIN_ROOM; height <= maxEdge; height++) {
      const floor = width * height;
      if (floor > target + tolerance) {
        break;
      }
      const delta = Math.abs(floor - target);
      if (delta > tolerance) {
        continue;
      }
      const aspectError = Math.abs(width / height - aspect);
      const fit = {
        width,
        height,
        depth: 0,
        floor,
        score: Math.round(aspectError * target * 1000) + delta * 1000,
      };
      const next = remember(ties, bestScore, fit);
      ties = next.ties;
      bestScore = next.bestScore;
    }
  }
  return ties;
}

function searchRow(
  leaves: number,
  target: number,
  tolerance: number,
  aspect: number,
  buildingType: BuildingType,
  maxEdge: number,
): Fit[] {
  let ties: Fit[] = [];
  let bestScore = Number.POSITIVE_INFINITY;
  const maxWidth = Math.floor((maxEdge - (leaves - 1)) / leaves);
  for (let width = MIN_ROOM; width <= maxWidth; width++) {
    const span = leaves * width + (leaves - 1);
    if (span > maxEdge) {
      break;
    }
    if (leaves * width * MIN_ROOM + span * MIN_ROOM > target + tolerance) {
      break;
    }
    for (let height = MIN_ROOM; height <= maxEdge; height++) {
      const privateArea = leaves * width * height;
      if (privateArea + span * MIN_ROOM > target + tolerance) {
        break;
      }
      let depth = Math.round((target - privateArea) / span);
      if (depth < MIN_ROOM) {
        depth = MIN_ROOM;
      }
      const interiorH = height + 1 + depth;
      if (interiorH > maxEdge) {
        continue;
      }
      const floor = privateArea + span * depth;
      const delta = Math.abs(floor - target);
      if (delta > tolerance) {
        continue;
      }
      const hubArea = span * depth;
      let penalty = 0;
      if (buildingType === 'commercial') {
        if (hubArea < width * height) {
          penalty += target * 1000;
        }
        if (hubArea * 2 < floor) {
          penalty += target * 1000;
        }
      }
      const aspectError = Math.abs(span / interiorH - aspect);
      const fit = {
        width,
        height,
        depth,
        floor,
        score: Math.round(aspectError * target * 1000) + delta * 1000 + penalty,
      };
      const next = remember(ties, bestScore, fit);
      ties = next.ties;
      bestScore = next.bestScore;
    }
  }
  return ties;
}

function cellsAlong(start: TileCoord, count: number, axis: 'x' | 'y'): TileCoord[] {
  const cells: TileCoord[] = [];
  for (let offset = 0; offset < count; offset++) {
    cells.push({
      x: start.x + (axis === 'x' ? offset : 0),
      y: start.y + (axis === 'y' ? offset : 0),
    });
  }
  return cells;
}

function rowLayout(fit: Fit, leaves: number, hubRole: string, leafRole: string): MapLayout {
  const span = leaves * fit.width + (leaves - 1);
  const rooms: Room[] = [
    {
      id: 'room-1',
      role: hubRole,
      x: 1,
      y: 1 + fit.height + 1,
      width: span,
      height: fit.depth,
    },
  ];
  const walls: SharedWall[] = [];
  let wallNumber = 1;
  for (let index = 0; index < leaves; index++) {
    const x = 1 + index * (fit.width + 1);
    const id = `room-${index + 2}`;
    rooms.push({
      id,
      role: leafRole,
      x,
      y: 1,
      width: fit.width,
      height: fit.height,
    });
    walls.push({
      id: `wall-${wallNumber}`,
      orientation: 'horizontal',
      a: [id],
      b: ['room-1'],
      cells: cellsAlong({ x, y: 1 + fit.height }, fit.width, 'x'),
    });
    wallNumber += 1;
  }
  for (let index = 1; index < leaves; index++) {
    walls.push({
      id: `wall-${wallNumber}`,
      orientation: 'vertical',
      a: [`room-${index + 1}`],
      b: [`room-${index + 2}`],
      cells: cellsAlong({ x: index * (fit.width + 1), y: 1 }, fit.height + 1, 'y'),
    });
    wallNumber += 1;
  }
  return {
    width: span + 2,
    height: fit.height + 1 + fit.depth + 2,
    rooms,
    walls,
    openings: [],
  };
}

function singleLayout(fit: Fit, role: string): MapLayout {
  return {
    width: fit.width + 2,
    height: fit.height + 2,
    rooms: [
      {
        id: 'room-1',
        role,
        x: 1,
        y: 1,
        width: fit.width,
        height: fit.height,
      },
    ],
    walls: [],
    openings: [],
  };
}

/**
 * Rectangular floor plan from a building-type adjacency template.
 * One room is a single rectangle. More rooms are a star: a hall or sales floor
 * spans the south side, and every other room shares its own wall with that span.
 */
export function generateAdjacencyLayout(
  parameters: MapParameters,
  seed = 'adjacency',
): AdjacencyLayoutResult {
  const errors = parameterErrors(parameters);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const target = interiorTileTarget(parameters.areaSquareFeet);
  const tolerance = areaTolerance(parameters.roomCount, target);
  const needed = minimumFloor(parameters.roomCount);
  if (target + tolerance < needed) {
    return {
      ok: false,
      errors: [`area is too small for ${parameters.roomCount} ${parameters.buildingType} rooms`],
    };
  }

  const maxEdge = MAP_MAX_EDGE - 2;
  const aspect = buildingAspect(parameters.buildingType);
  const leaves = parameters.roomCount - 1;
  const ties =
    leaves === 0
      ? searchSingle(target, tolerance, aspect, maxEdge)
      : searchRow(leaves, target, tolerance, aspect, parameters.buildingType, maxEdge);
  const fit = shuffle(ties, randomSource(seed))[0];
  if (!fit) {
    return {
      ok: false,
      errors: [
        `no footprint within ${MAP_MAX_EDGE}×${MAP_MAX_EDGE} keeps the floor area within ${tolerance} tiles of ${target}`,
      ],
    };
  }

  const hubRole =
    parameters.buildingType === 'commercial' ? 'sales' : leaves === 0 ? 'room' : 'hall';
  const layout =
    leaves === 0
      ? singleLayout(fit, hubRole)
      : rowLayout(
          fit,
          leaves,
          hubRole,
          parameters.buildingType === 'commercial' ? 'support' : 'private',
        );
  const planned = planOpenings(layout, parameters.buildingType, randomSource(`${seed}:openings`), {
    entranceRoomId: 'room-1',
  });
  if (planned.errors.length > 0) {
    return { ok: false, errors: planned.errors };
  }
  const opened = { ...layout, openings: planned.openings };
  const issues = layoutIssues(opened);
  if (issues.length > 0) {
    return { ok: false, errors: issues };
  }
  return {
    ok: true,
    generatorId: ADJACENCY_GENERATOR_ID,
    parameters,
    seed,
    interiorTiles: fit.floor,
    layout: opened,
  };
}
