import {
  MAP_MAX_EDGE,
  layoutIssues,
  type MapLayout,
  type MapParameters,
  type Room,
  type SharedWall,
  type TileCoord,
} from '../../types/map';
import { buildingAspect } from './buildingTypeProfile';
import { planOpenings } from './planOpenings';
import { randomSource, type RandomSource } from './randomSource';

export const BSP_GENERATOR_ID = 'bsp-v1';

/** 1 square foot in square meters. The grid is 1 m per tile. */
const SQ_FT_TO_SQ_M = 0.092903;

const MIN_ROOM = 3;

export interface BspLayoutSuccess {
  ok: true;
  generatorId: typeof BSP_GENERATOR_ID;
  parameters: MapParameters;
  seed: string;
  interiorTiles: number;
  layout: MapLayout;
}

export interface BspLayoutFailure {
  ok: false;
  errors: string[];
}

export type BspLayoutResult = BspLayoutSuccess | BspLayoutFailure;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LeafNode {
  kind: 'leaf';
  rect: Rect;
}

interface SplitNode {
  kind: 'split';
  axis: 'vertical' | 'horizontal';
  wall: Rect;
  left: BspNode;
  right: BspNode;
}

type BspNode = LeafNode | SplitNode;

interface SplitChoice {
  k: number;
  span: number;
  score: number;
}

export function interiorTileTarget(areaSquareFeet: number): number {
  return Math.round(areaSquareFeet * SQ_FT_TO_SQ_M);
}

export function areaTolerance(roomCount: number, target: number): number {
  return Math.max(roomCount, Math.round(target * 0.1));
}

function roomsAlong(side: number): number {
  if (side < MIN_ROOM) {
    return 0;
  }
  return Math.floor((side + 1) / (MIN_ROOM + 1));
}

/** How many min-size rooms a rectangle can hold once one-tile walls are inserted. */
function maxRooms(width: number, height: number): number {
  return roomsAlong(width) * roomsAlong(height);
}

function minSpan(rooms: number, cross: number, axis: 'vertical' | 'horizontal'): number {
  if (cross < MIN_ROOM || rooms < 1) {
    return Number.POSITIVE_INFINITY;
  }
  const limit = rooms * (MIN_ROOM + 1);
  for (let span = MIN_ROOM; span <= limit; span++) {
    const fits =
      axis === 'vertical' ? maxRooms(span, cross) >= rooms : maxRooms(cross, span) >= rooms;
    if (fits) {
      return span;
    }
  }
  return Number.POSITIVE_INFINITY;
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

function orderTies<T>(items: readonly T[], rng: RandomSource): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = rng.int(0, index);
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}

function partition(rect: Rect, rooms: number, depth: number, rng: RandomSource): BspNode | null {
  if (rooms === 1) {
    if (rect.w < MIN_ROOM || rect.h < MIN_ROOM) {
      return null;
    }
    return { kind: 'leaf', rect };
  }

  const preferred = depth % 2 === 0 ? 'vertical' : 'horizontal';
  const axes = [preferred, preferred === 'vertical' ? 'horizontal' : 'vertical'] as const;
  for (const axis of axes) {
    const split = splitOn(rect, rooms, axis, depth, rng);
    if (split) {
      return split;
    }
  }
  return null;
}

function splitOn(
  rect: Rect,
  rooms: number,
  axis: 'vertical' | 'horizontal',
  depth: number,
  rng: RandomSource,
): SplitNode | null {
  const primary = axis === 'vertical' ? rect.w : rect.h;
  const cross = axis === 'vertical' ? rect.h : rect.w;
  if (primary < MIN_ROOM + 1 + MIN_ROOM) {
    return null;
  }

  const choices: SplitChoice[] = [];
  for (let k = 1; k < rooms; k++) {
    const minLeft = minSpan(k, cross, axis);
    const minRight = minSpan(rooms - k, cross, axis);
    if (minLeft + 1 + minRight > primary) {
      continue;
    }
    const ideal = Math.round((primary - 1) * (k / rooms));
    const span = Math.min(primary - 1 - minRight, Math.max(minLeft, ideal));
    choices.push({ k, span, score: Math.abs(k / rooms - 0.5) });
  }
  if (choices.length === 0) {
    return null;
  }

  const bestScore = Math.min(...choices.map((choice) => choice.score));
  const ties = choices.filter((choice) => choice.score === bestScore);
  for (const choice of orderTies(ties, rng)) {
    const leftRect =
      axis === 'vertical'
        ? { x: rect.x, y: rect.y, w: choice.span, h: rect.h }
        : { x: rect.x, y: rect.y, w: rect.w, h: choice.span };
    const wall =
      axis === 'vertical'
        ? { x: rect.x + choice.span, y: rect.y, w: 1, h: rect.h }
        : { x: rect.x, y: rect.y + choice.span, w: rect.w, h: 1 };
    const rightRect =
      axis === 'vertical'
        ? { x: wall.x + 1, y: rect.y, w: rect.w - choice.span - 1, h: rect.h }
        : { x: rect.x, y: wall.y + 1, w: rect.w, h: rect.h - choice.span - 1 };
    const left = partition(leftRect, choice.k, depth + 1, rng);
    const right = partition(rightRect, rooms - choice.k, depth + 1, rng);
    if (left && right) {
      return { kind: 'split', axis, wall, left, right };
    }
  }
  return null;
}

function wallCells(wall: Rect): TileCoord[] {
  const cells: TileCoord[] = [];
  for (let y = 0; y < wall.h; y++) {
    for (let x = 0; x < wall.w; x++) {
      cells.push({ x: wall.x + x + 1, y: wall.y + y + 1 });
    }
  }
  return cells;
}

function place(
  node: BspNode,
  rooms: Room[],
  walls: SharedWall[],
  ids: { room: number; wall: number },
): string[] {
  if (node.kind === 'leaf') {
    const id = `room-${ids.room}`;
    ids.room += 1;
    rooms.push({
      id,
      x: node.rect.x + 1,
      y: node.rect.y + 1,
      width: node.rect.w,
      height: node.rect.h,
    });
    return [id];
  }

  const a = place(node.left, rooms, walls, ids);
  const b = place(node.right, rooms, walls, ids);
  const id = `wall-${ids.wall}`;
  ids.wall += 1;
  walls.push({
    id,
    orientation: node.axis === 'vertical' ? 'vertical' : 'horizontal',
    a,
    b,
    cells: wallCells(node.wall),
  });
  return [...a, ...b];
}

interface Candidate {
  width: number;
  height: number;
  score: number;
}

function candidates(
  target: number,
  roomCount: number,
  aspect: number,
  tolerance: number,
): Candidate[] {
  const wallEstimate = Math.max(0, roomCount - 1) * Math.ceil(Math.sqrt(target + tolerance));
  const maxGross = target + tolerance + wallEstimate;
  const seen = new Set<string>();
  const found: Candidate[] = [];

  for (let height = MIN_ROOM; height <= MAP_MAX_EDGE - 2; height++) {
    const widths = [Math.round(height * aspect), Math.round((target + wallEstimate) / height)];
    for (const width of widths) {
      if (width < MIN_ROOM || width > MAP_MAX_EDGE - 2) {
        continue;
      }
      const key = `${width}x${height}`;
      if (seen.has(key)) {
        continue;
      }
      const gross = width * height;
      if (gross < target || gross > maxGross || maxRooms(width, height) < roomCount) {
        continue;
      }
      seen.add(key);
      const aspectError = Math.abs(width / height - aspect);
      found.push({
        width,
        height,
        score: aspectError * target + Math.abs(gross - (target + wallEstimate)),
      });
    }
  }

  found.sort(
    (left, right) =>
      left.score - right.score || left.width * left.height - right.width * right.height,
  );
  return found.slice(0, 80);
}

function layoutFromTree(tree: BspNode, width: number, height: number): MapLayout {
  const rooms: Room[] = [];
  const walls: SharedWall[] = [];
  place(tree, rooms, walls, { room: 1, wall: 1 });
  return { width: width + 2, height: height + 2, rooms, walls, openings: [] };
}

function floorTiles(rooms: readonly Room[]): number {
  return rooms.reduce((sum, room) => sum + room.width * room.height, 0);
}

export function generateBspLayout(parameters: MapParameters, seed = 'bsp'): BspLayoutResult {
  const errors = parameterErrors(parameters);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const target = interiorTileTarget(parameters.areaSquareFeet);
  const minimumFloor = parameters.roomCount * MIN_ROOM * MIN_ROOM;
  if (target < minimumFloor) {
    return { ok: false, errors: [`area is too small for ${parameters.roomCount} rooms`] };
  }

  const tolerance = areaTolerance(parameters.roomCount, target);
  const rng = randomSource(seed);
  let closestFloor: number | null = null;
  let closestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of candidates(
    target,
    parameters.roomCount,
    buildingAspect(parameters.buildingType),
    tolerance,
  )) {
    const tree = partition(
      { x: 0, y: 0, w: candidate.width, h: candidate.height },
      parameters.roomCount,
      0,
      rng,
    );
    if (!tree) {
      continue;
    }
    const layout = layoutFromTree(tree, candidate.width, candidate.height);
    const interiorTiles = floorTiles(layout.rooms);
    const delta = Math.abs(interiorTiles - target);
    if (delta < closestDelta) {
      closestDelta = delta;
      closestFloor = interiorTiles;
    }
    if (delta > tolerance) {
      continue;
    }
    const planned = planOpenings(layout, parameters.buildingType, randomSource(`${seed}:openings`));
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
      generatorId: BSP_GENERATOR_ID,
      parameters,
      seed,
      interiorTiles,
      layout: opened,
    };
  }

  const detail =
    closestFloor === null
      ? `no footprint within ${MAP_MAX_EDGE}×${MAP_MAX_EDGE} can hold ${parameters.roomCount} rooms`
      : `no footprint within ${MAP_MAX_EDGE}×${MAP_MAX_EDGE} keeps the floor area within ${tolerance} tiles of ${target}. Closest floor was ${closestFloor}.`;
  return { ok: false, errors: [detail] };
}
