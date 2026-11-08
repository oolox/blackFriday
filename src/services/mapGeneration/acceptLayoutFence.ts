import {
  layoutIssues,
  roomRects,
  type BuildingType,
  type GeneratedMap,
  type Room,
  type RoomPart,
  type SharedWall,
  type TileCoord,
} from '../../types/map';
import type { Tile } from '../../types/tile';
import { interiorTileTarget } from './generateBspLayout';
import { layoutTolerance } from './layoutPrompt';
import { planOpenings } from './planOpenings';
import { randomSource } from './randomSource';
import { rasterizeStruct } from './rasterizeStruct';

export const LLM_GENERATOR_ID = 'llm-v1';

const MIN_SIDE = 3;

interface FenceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FenceRoom {
  id: string;
  role: string;
  rects: FenceRect[];
}

interface FenceData {
  areaSquareFeet: number;
  roomCount: number;
  width: number;
  height: number;
  buildingType: BuildingType;
  outside: TileCoord[];
  rooms: FenceRoom[];
}

export interface AcceptLayoutRequest {
  text: string;
  seed: string;
  tiles: readonly Tile[];
  brief: string;
}

/** Parse an assistant fence, derive walls and openings, and stamp the grid. Does not call fal. */
export function acceptLayoutFence(
  request: AcceptLayoutRequest,
): { ok: true; map: GeneratedMap } | { ok: false; errors: string[] } {
  const parsed = parseFence(request.text, request.seed);
  if (!parsed.ok) {
    return parsed;
  }
  const data = parsed.data;
  const rooms = toRooms(data.rooms);
  const roomError = validateRooms(rooms, data.width, data.height);
  if (roomError) {
    return { ok: false, errors: [roomError] };
  }
  if (data.roomCount !== rooms.length) {
    return { ok: false, errors: ['roomCount does not match the room list'] };
  }
  const target = interiorTileTarget(data.areaSquareFeet);
  const floor = rooms.reduce(
    (sum, room) =>
      sum + roomRects(room).reduce((partSum, part) => partSum + part.width * part.height, 0),
    0,
  );
  if (Math.abs(floor - target) > layoutTolerance(target)) {
    return {
      ok: false,
      errors: [`floor area ${floor} is outside ${layoutTolerance(target)} tiles of ${target}`],
    };
  }
  const layout = {
    width: data.width,
    height: data.height,
    rooms,
    walls: deriveSharedWalls(rooms),
    openings: [],
    ...(data.outside.length > 0 ? { outside: data.outside } : {}),
  };
  const issues = layoutIssues(layout);
  if (issues.length > 0) {
    return { ok: false, errors: issues };
  }
  const entrance = rooms.find((room) => room.role === 'hall' || room.role === 'concourse');
  const openings = planOpenings(
    layout,
    data.buildingType,
    randomSource(`${request.seed}:openings`),
    {
      entranceRoomId: entrance?.id,
    },
  );
  layout.openings = openings.openings;
  const openingIssues = layoutIssues(layout);
  if (openings.errors.length > 0 || openingIssues.length > 0) {
    return { ok: false, errors: [...openings.errors, ...openingIssues] };
  }
  const stamped = rasterizeStruct(layout, request.tiles);
  if (!stamped.ok) {
    return stamped;
  }
  return {
    ok: true,
    map: {
      parameters: {
        areaSquareFeet: data.areaSquareFeet,
        roomCount: data.roomCount,
        buildingType: data.buildingType,
      },
      seed: request.seed,
      generatorId: LLM_GENERATOR_ID,
      brief: request.brief,
      rawFence: parsed.rawFence,
      interiorTiles: stamped.grid.interiorTiles,
      layout,
      palette: stamped.grid.palette,
      cells: stamped.grid.cells,
    },
  };
}

function parseFence(
  text: string,
  seed: string,
): { ok: true; data: FenceData; rawFence: string } | { ok: false; errors: string[] } {
  if (text.trim() === '') {
    return { ok: false, errors: ['layout reply was empty'] };
  }
  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
  if (fences.length === 0) {
    return { ok: false, errors: ['layout reply had no json fence'] };
  }
  const layouts: Array<{ data: FenceData; rawFence: string }> = [];
  for (const fence of fences) {
    const body = fence[1]?.trim() ?? '';
    let value: unknown;
    try {
      value = JSON.parse(body);
    } catch {
      return { ok: false, errors: ['layout fence was not valid json'] };
    }
    if (!isRecord(value) || value.tool !== 'layout') {
      continue;
    }
    if (value.origin !== 'agent' || value.action !== 'create') {
      return { ok: false, errors: ['layout fence must come from the agent'] };
    }
    if (value.id !== seed) {
      return { ok: false, errors: ['layout fence id does not match the seed'] };
    }
    const data = readData(value.data);
    if (!data.ok) {
      return data;
    }
    layouts.push({ data: data.data, rawFence: fence[0] });
  }
  const last = layouts[layouts.length - 1];
  if (!last) {
    return { ok: false, errors: ['layout reply used the wrong tool'] };
  }
  return { ok: true, data: last.data, rawFence: last.rawFence };
}

function readData(value: unknown): { ok: true; data: FenceData } | { ok: false; errors: string[] } {
  if (!isRecord(value)) {
    return { ok: false, errors: ['layout data was missing'] };
  }
  if (typeof value.areaSquareFeet !== 'number' || !(value.areaSquareFeet > 0)) {
    return { ok: false, errors: ['areaSquareFeet must be a positive number'] };
  }
  if (!Number.isInteger(value.roomCount) || (value.roomCount as number) < 1) {
    return { ok: false, errors: ['roomCount must be a positive integer'] };
  }
  const width = value.width;
  const height = value.height;
  if (!isBoxEdge(width) || !isBoxEdge(height)) {
    return { ok: false, errors: ['layout width and height must be integers from 1 to 1024'] };
  }
  if (value.buildingType !== 'residential' && value.buildingType !== 'commercial') {
    return { ok: false, errors: ['layout buildingType must be residential or commercial'] };
  }
  if (!Array.isArray(value.outside) || !Array.isArray(value.rooms)) {
    return { ok: false, errors: ['layout rooms and outside must be lists'] };
  }
  const outside: TileCoord[] = [];
  for (const cell of value.outside) {
    if (!isRecord(cell) || !Number.isInteger(cell.x) || !Number.isInteger(cell.y)) {
      return { ok: false, errors: ['layout outside cells must be integer coordinates'] };
    }
    outside.push({ x: cell.x, y: cell.y });
  }
  const rooms: FenceRoom[] = [];
  for (const room of value.rooms) {
    if (
      !isRecord(room) ||
      typeof room.id !== 'string' ||
      room.id === '' ||
      typeof room.role !== 'string'
    ) {
      return { ok: false, errors: ['each room needs an id and a role'] };
    }
    if (!Array.isArray(room.rects) || room.rects.length === 0) {
      return { ok: false, errors: [`room ${room.id} needs at least one rect`] };
    }
    const rects: FenceRect[] = [];
    for (const rect of room.rects) {
      if (
        !isRecord(rect) ||
        !Number.isInteger(rect.x) ||
        !Number.isInteger(rect.y) ||
        !Number.isInteger(rect.width) ||
        !Number.isInteger(rect.height)
      ) {
        return { ok: false, errors: [`room ${room.id} rects must use integers`] };
      }
      rects.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    }
    rooms.push({ id: room.id, role: room.role, rects });
  }
  return {
    ok: true,
    data: {
      areaSquareFeet: value.areaSquareFeet,
      roomCount: value.roomCount as number,
      width,
      height,
      buildingType: value.buildingType,
      outside,
      rooms,
    },
  };
}

function toRooms(rooms: FenceRoom[]): Room[] {
  return rooms.map((room) => {
    const [first, ...rest] = room.rects;
    return {
      id: room.id,
      role: room.role,
      x: first?.x ?? 0,
      y: first?.y ?? 0,
      width: first?.width ?? 0,
      height: first?.height ?? 0,
      ...(rest.length > 0 ? { parts: rest.map(toPart) } : {}),
    };
  });
}

function toPart(rect: FenceRect): RoomPart {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function validateRooms(rooms: Room[], width: number, height: number): string | null {
  if (rooms.length === 0) {
    return 'layout has no rooms';
  }
  for (const room of rooms) {
    for (const part of roomRects(room)) {
      if (part.width < MIN_SIDE || part.height < MIN_SIDE) {
        return `room ${room.id} is smaller than ${MIN_SIDE} by ${MIN_SIDE}`;
      }
      const inset =
        part.x < 1 ||
        part.y < 1 ||
        part.x + part.width > width - 1 ||
        part.y + part.height > height - 1;
      if (inset) {
        return `room ${room.id} meets the outer shell`;
      }
    }
  }
  return null;
}

function deriveSharedWalls(rooms: Room[]): SharedWall[] {
  const walls: SharedWall[] = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const left = rooms[i];
      const right = rooms[j];
      if (!left || !right) {
        continue;
      }
      const vertical: TileCoord[] = [];
      const horizontal: TileCoord[] = [];
      for (const a of roomRects(left)) {
        for (const b of roomRects(right)) {
          pushGap(vertical, horizontal, a, b);
        }
      }
      if (vertical.length > 0) {
        vertical.sort((p, q) => p.y - q.y || p.x - q.x);
        walls.push({
          id: `${left.id}-${right.id}`,
          orientation: 'vertical',
          a: [left.id],
          b: [right.id],
          cells: vertical,
        });
      }
      if (horizontal.length > 0) {
        horizontal.sort((p, q) => p.x - q.x || p.y - q.y);
        walls.push({
          id: `${left.id}-${right.id}-h`,
          orientation: 'horizontal',
          a: [left.id],
          b: [right.id],
          cells: horizontal,
        });
      }
    }
  }
  return walls;
}

function pushGap(vertical: TileCoord[], horizontal: TileCoord[], a: RoomPart, b: RoomPart): void {
  if (a.x + a.width + 1 === b.x) {
    pushSpan(vertical, b.x - 1, overlap(a.y, a.y + a.height, b.y, b.y + b.height), 'vertical');
  } else if (b.x + b.width + 1 === a.x) {
    pushSpan(vertical, a.x - 1, overlap(a.y, a.y + a.height, b.y, b.y + b.height), 'vertical');
  } else if (a.y + a.height + 1 === b.y) {
    pushSpan(horizontal, b.y - 1, overlap(a.x, a.x + a.width, b.x, b.x + b.width), 'horizontal');
  } else if (b.y + b.height + 1 === a.y) {
    pushSpan(horizontal, a.y - 1, overlap(a.x, a.x + a.width, b.x, b.x + b.width), 'horizontal');
  }
}

function pushSpan(
  cells: TileCoord[],
  fixed: number,
  span: { start: number; end: number } | null,
  orientation: 'vertical' | 'horizontal',
): void {
  if (!span) {
    return;
  }
  for (let cursor = span.start; cursor < span.end; cursor++) {
    cells.push(orientation === 'vertical' ? { x: fixed, y: cursor } : { x: cursor, y: fixed });
  }
}

function overlap(
  a0: number,
  a1: number,
  b0: number,
  b1: number,
): { start: number; end: number } | null {
  const start = Math.max(a0, b0);
  const end = Math.min(a1, b1);
  return end > start ? { start, end } : null;
}

function isBoxEdge(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 1024;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
