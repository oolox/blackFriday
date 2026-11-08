import {
  layoutIssues,
  type MapLayout,
  type MapParameters,
  type Room,
  type RoomPart,
  type SharedWall,
  type TileCoord,
} from '../../types/map';
import { areaTolerance } from './generateBspLayout';
import { planOpenings } from './planOpenings';
import { planRoomProgram, type ProgramRoom, type RoomProgram } from './planRoomProgram';
import { randomSource, type RandomSource } from './randomSource';

export const PROGRAM_GENERATOR_ID = 'program-v1';

const MIN_SIDE = 3;

export interface ProgramLayoutSuccess {
  ok: true;
  generatorId: typeof PROGRAM_GENERATOR_ID;
  parameters: MapParameters;
  seed: string;
  interiorTiles: number;
  layout: MapLayout;
}

export interface ProgramLayoutFailure {
  ok: false;
  errors: string[];
}

export type ProgramLayoutResult = ProgramLayoutSuccess | ProgramLayoutFailure;

type Family = 'rectangle' | 'l' | 'atrium' | 'combination';

interface Placed {
  id: string;
  role: string;
  x: number;
  y: number;
  w: number;
  h: number;
  parts?: RoomPart[];
}

interface Candidate {
  score: number;
  placed: Placed[];
  court: TileCoord[];
}

/**
 * Places the room program into a rectangle, an L, or a rectangle with an atrium.
 * `adjacency-v1` and `bsp-v1` are unchanged.
 */
export function generateProgramLayout(
  parameters: MapParameters,
  seed = 'program',
): ProgramLayoutResult {
  const planned = planRoomProgram(parameters, seed);
  if (!planned.ok) {
    return planned;
  }
  const program = planned.program;
  const rng = randomSource(seed);
  const preferred = pickFamily(program, rng);
  const order: Family[] = [
    preferred,
    ...(['rectangle', 'l', 'atrium', 'combination'] as const).filter(
      (family) => family !== preferred,
    ),
  ];
  for (const family of order) {
    const placed = placeFamily(program, family);
    if (!placed) {
      continue;
    }
    const oriented = orient(
      placed.placed,
      placed.court,
      parameters.buildingType,
      program.rooms.find((room) => room.takesEntrance)?.id ?? '',
      rng,
    );
    if (!oriented) {
      continue;
    }
    const layout = toLayout(oriented.placed, oriented.court);
    const openings = planOpenings(
      layout,
      parameters.buildingType,
      randomSource(`${seed}:openings`),
      {
        entranceRoomId: program.rooms.find((room) => room.takesEntrance)?.id,
      },
    );
    layout.openings = openings.openings;
    if (openings.errors.length > 0 || layoutIssues(layout).length > 0) {
      continue;
    }
    const floor = floorTiles(oriented.placed);
    return {
      ok: true,
      generatorId: PROGRAM_GENERATOR_ID,
      parameters,
      seed,
      interiorTiles: floor,
      layout,
    };
  }
  return {
    ok: false,
    errors: [`no footprint fits ${parameters.roomCount} ${parameters.buildingType} rooms`],
  };
}

function pickFamily(program: RoomProgram, rng: RandomSource): Family {
  const choices: Family[] = ['rectangle', 'l'];
  if (program.targetTiles >= 140 && program.rooms.length >= 4) {
    choices.push('atrium');
  }
  if (program.targetTiles >= 160 && program.rooms.length >= 4) {
    choices.push('combination');
  }
  return rng.pick(choices);
}

function placeFamily(
  program: RoomProgram,
  family: Family,
): { placed: Placed[]; court: TileCoord[] } | null {
  if (family === 'rectangle' || family === 'atrium') {
    return searchColumns(program, family === 'atrium');
  }
  return searchFoot(program, family === 'combination');
}

function searchColumns(
  program: RoomProgram,
  court: boolean,
): { placed: Placed[]; court: TileCoord[] } | null {
  const hub = program.rooms.find((room) => room.takesEntrance);
  const rest = program.rooms
    .filter((room) => room !== hub)
    .sort((a, b) => b.targetArea - a.targetArea);
  const large = rest[0];
  const stack = rest.slice(1);
  if (!hub) {
    return null;
  }
  if (!large) {
    const size = fitRect(hub.targetArea, hub.minAspect, hub.maxAspect);
    return {
      placed: [{ id: hub.id, role: hub.role, x: 1, y: 1, w: size.w, h: size.h }],
      court: [],
    };
  }

  let best: Candidate | null = null;
  const minH = Math.max(MIN_SIDE, stack.length * MIN_SIDE + Math.max(0, stack.length - 1));
  for (let height = minH; height <= minH + 14; height++) {
    const heights = splitHeights(
      stack.map((room) => room.targetArea),
      height,
    );
    if (stack.length > 0 && !heights) {
      continue;
    }
    for (let hubW = MIN_SIDE; hubW <= 16; hubW++) {
      if (!aspectOk(hub, hubW, height)) {
        continue;
      }
      for (let largeW = MIN_SIDE; largeW <= 28; largeW++) {
        if (!aspectOk(large, largeW, height)) {
          continue;
        }
        const stackWidths = stack.length === 0 ? [0] : range(MIN_SIDE, 14);
        for (const stackW of stackWidths) {
          if (stack.length > 0 && heights) {
            const bad = stack.some((room, index) => !aspectOk(room, stackW, heights[index] ?? 0));
            if (bad) {
              continue;
            }
          }
          const placed = columns(hub, large, stack, hubW, largeW, stackW, height, heights ?? []);
          const carved = court ? carve(placed, large.id) : { placed, court: [] as TileCoord[] };
          if (!carved) {
            continue;
          }
          const candidate = score(program, carved.placed, carved.court);
          if (candidate && (!best || candidate.score < best.score)) {
            best = candidate;
          }
        }
      }
    }
  }
  return best ? { placed: best.placed, court: best.court } : null;
}

function searchFoot(
  program: RoomProgram,
  court: boolean,
): { placed: Placed[]; court: TileCoord[] } | null {
  const hub = program.rooms.find((room) => room.takesEntrance);
  const rest = program.rooms
    .filter((room) => room !== hub)
    .sort((a, b) => b.targetArea - a.targetArea);
  const large = rest[0];
  const feet = rest.slice(1);
  if (!hub || !large) {
    return searchColumns(program, court);
  }
  let best: Candidate | null = null;
  for (let topH = MIN_SIDE; topH <= 16; topH++) {
    for (let hubW = MIN_SIDE; hubW <= 12; hubW++) {
      if (!aspectOk(hub, hubW, topH)) {
        continue;
      }
      for (let largeW = MIN_SIDE; largeW <= 28; largeW++) {
        if (!aspectOk(large, largeW, topH)) {
          continue;
        }
        const footHeights = splitHeights(
          feet.map((room) => room.targetArea),
          feet.length * MIN_SIDE + Math.max(0, feet.length - 1),
        );
        const heights = footHeights ?? feet.map(() => MIN_SIDE);
        if (feet.some((room, index) => !aspectOk(room, hubW, heights[index] ?? MIN_SIDE))) {
          continue;
        }
        const placed = footPlan(hub, large, feet, hubW, largeW, topH, heights);
        const carved = court ? carve(placed, large.id) : { placed, court: [] as TileCoord[] };
        if (!carved) {
          continue;
        }
        const candidate = score(program, carved.placed, carved.court);
        if (candidate && (!best || candidate.score < best.score)) {
          best = candidate;
        }
      }
    }
  }
  return best ? { placed: best.placed, court: best.court } : null;
}

function columns(
  hub: ProgramRoom,
  large: ProgramRoom,
  stack: ProgramRoom[],
  hubW: number,
  largeW: number,
  stackW: number,
  height: number,
  heights: number[],
): Placed[] {
  const placed: Placed[] = [
    { id: hub.id, role: hub.role, x: 1, y: 1, w: hubW, h: height },
    { id: large.id, role: large.role, x: hubW + 2, y: 1, w: largeW, h: height },
  ];
  let y = 1;
  stack.forEach((room, index) => {
    const h = heights[index] ?? MIN_SIDE;
    placed.push({
      id: room.id,
      role: room.role,
      x: hubW + largeW + 3,
      y,
      w: stackW,
      h,
    });
    y += h + 1;
  });
  return placed;
}

function footPlan(
  hub: ProgramRoom,
  large: ProgramRoom,
  feet: ProgramRoom[],
  hubW: number,
  largeW: number,
  topH: number,
  heights: number[],
): Placed[] {
  const placed: Placed[] = [
    { id: hub.id, role: hub.role, x: 1, y: 1, w: hubW, h: topH },
    { id: large.id, role: large.role, x: hubW + 2, y: 1, w: largeW, h: topH },
  ];
  let y = topH + 2;
  feet.forEach((room, index) => {
    const h = heights[index] ?? MIN_SIDE;
    placed.push({ id: room.id, role: room.role, x: 1, y, w: hubW, h });
    y += h + 1;
  });
  return placed;
}

function carve(placed: Placed[], roomId: string): { placed: Placed[]; court: TileCoord[] } | null {
  const room = placed.find((candidate) => candidate.id === roomId);
  if (!room || room.w < 11 || room.h < 11) {
    return null;
  }
  const courtW = 3;
  const courtH = 3;
  const cx = room.x + Math.floor((room.w - courtW) / 2);
  const cy = room.y + Math.floor((room.h - courtH) / 2);
  const hole = { x: cx - 1, y: cy - 1, w: courtW + 2, h: courtH + 2 };
  if (hole.x <= room.x || hole.y <= room.y) {
    return null;
  }
  if (hole.x + hole.w >= room.x + room.w || hole.y + hole.h >= room.y + room.h) {
    return null;
  }
  const parts = subtract(room, hole);
  const largest = parts.reduce((best, part) =>
    part.width * part.height > best.width * best.height ? part : best,
  );
  const court: TileCoord[] = [];
  for (let y = cy; y < cy + courtH; y++) {
    for (let x = cx; x < cx + courtW; x++) {
      court.push({ x, y });
    }
  }
  const next = placed.map((candidate) =>
    candidate.id === roomId
      ? {
          ...candidate,
          x: largest.x,
          y: largest.y,
          w: largest.width,
          h: largest.height,
          parts: parts.filter((part) => part !== largest),
        }
      : candidate,
  );
  return { placed: next, court };
}

function subtract(room: Placed, hole: { x: number; y: number; w: number; h: number }): RoomPart[] {
  const parts: RoomPart[] = [];
  if (hole.y > room.y) {
    parts.push({ x: room.x, y: room.y, width: room.w, height: hole.y - room.y });
  }
  const holeBottom = hole.y + hole.h;
  const roomBottom = room.y + room.h;
  if (holeBottom < roomBottom) {
    parts.push({ x: room.x, y: holeBottom, width: room.w, height: roomBottom - holeBottom });
  }
  if (hole.x > room.x) {
    parts.push({ x: room.x, y: hole.y, width: hole.x - room.x, height: hole.h });
  }
  const holeRight = hole.x + hole.w;
  const roomRight = room.x + room.w;
  if (holeRight < roomRight) {
    parts.push({ x: holeRight, y: hole.y, width: roomRight - holeRight, height: hole.h });
  }
  return parts;
}

function score(program: RoomProgram, placed: Placed[], court: TileCoord[]): Candidate | null {
  const areas = new Map(placed.map((room) => [room.id, roomArea(room)]));
  const total = [...areas.values()].reduce((sum, area) => sum + area, 0);
  const tolerance = areaTolerance(program.rooms.length, program.targetTiles);
  if (Math.abs(total - program.targetTiles) > tolerance) {
    return null;
  }
  const anchor = program.rooms.find((room) => room.role === 'living' || room.role === 'sales');
  if (anchor) {
    const anchorArea = areas.get(anchor.id) ?? 0;
    const smaller = program.rooms.every(
      (room) => room.id === anchor.id || (areas.get(room.id) ?? 0) < anchorArea,
    );
    if (!smaller) {
      return null;
    }
    if (anchor.role === 'sales' && anchorArea < Math.ceil(program.targetTiles / 2)) {
      return null;
    }
  }
  let delta = Math.abs(total - program.targetTiles) * 5;
  for (const room of program.rooms) {
    delta += Math.abs((areas.get(room.id) ?? 0) - room.targetArea);
  }
  return { score: delta + court.length, placed, court };
}

function orient(
  placed: Placed[],
  court: TileCoord[],
  buildingType: MapParameters['buildingType'],
  hubId: string,
  rng: RandomSource,
): { placed: Placed[]; court: TileCoord[] } | null {
  const mirrored = rng.next() < 0.5 ? flipX(placed, court) : { placed, court };
  if (entranceOk(mirrored.placed, hubId, buildingType)) {
    return mirrored;
  }
  const original = { placed, court };
  if (entranceOk(original.placed, hubId, buildingType)) {
    return original;
  }
  return null;
}

function flipX(placed: Placed[], court: TileCoord[]): { placed: Placed[]; court: TileCoord[] } {
  let maxX = 1;
  for (const room of placed) {
    for (const part of placedRects(room)) {
      maxX = Math.max(maxX, part.x + part.width - 1);
    }
  }
  const flip = (x: number, width: number) => maxX + 2 - x - width;
  return {
    placed: placed.map((room) => {
      const parts = placedRects(room).map((part) => ({
        x: flip(part.x, part.width),
        y: part.y,
        width: part.width,
        height: part.height,
      }));
      const [first, ...rest] = parts;
      return {
        ...room,
        x: first?.x ?? room.x,
        y: first?.y ?? room.y,
        w: first?.width ?? room.w,
        h: first?.height ?? room.h,
        parts: rest,
      };
    }),
    court: court.map((cell) => ({ x: maxX + 1 - cell.x, y: cell.y })),
  };
}

function entranceOk(
  placed: Placed[],
  hubId: string,
  buildingType: MapParameters['buildingType'],
): boolean {
  const hub = placed.find((room) => room.id === hubId);
  if (!hub) {
    return false;
  }
  let maxX = 1;
  let maxY = 1;
  for (const room of placed) {
    for (const part of placedRects(room)) {
      maxX = Math.max(maxX, part.x + part.width - 1);
      maxY = Math.max(maxY, part.y + part.height - 1);
    }
  }
  const width = maxX + 2;
  const height = maxY + 2;
  const north = placedRects(hub).some((part) => part.y === 1);
  const south = placedRects(hub).some((part) => part.y + part.height === height - 1);
  const west = placedRects(hub).some((part) => part.x === 1);
  const east = placedRects(hub).some((part) => part.x + part.width === width - 1);
  if (buildingType !== 'commercial' || width === height) {
    return north || south || west || east;
  }
  return width > height ? north || south : west || east;
}

function toLayout(placed: Placed[], court: TileCoord[]): MapLayout {
  let maxX = 1;
  let maxY = 1;
  for (const room of placed) {
    for (const part of placedRects(room)) {
      maxX = Math.max(maxX, part.x + part.width - 1);
      maxY = Math.max(maxY, part.y + part.height - 1);
    }
  }
  const width = maxX + 2;
  const height = maxY + 2;
  const floor = new Set<string>();
  for (const room of placed) {
    for (const part of placedRects(room)) {
      for (let y = part.y; y < part.y + part.height; y++) {
        for (let x = part.x; x < part.x + part.width; x++) {
          floor.add(`${x},${y}`);
        }
      }
    }
  }
  const isFloor = (x: number, y: number) => floor.has(`${x},${y}`);
  const wallish = (x: number, y: number) =>
    !isFloor(x, y) &&
    (isFloor(x - 1, y) || isFloor(x + 1, y) || isFloor(x, y - 1) || isFloor(x, y + 1));
  const outside: TileCoord[] = [...court];
  const seen = new Set(court.map((cell) => `${cell.x},${cell.y}`));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isFloor(x, y) || wallish(x, y) || seen.has(`${x},${y}`)) {
        continue;
      }
      const onRim = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      const besideWall =
        wallish(x - 1, y) || wallish(x + 1, y) || wallish(x, y - 1) || wallish(x, y + 1);
      if (onRim && besideWall) {
        continue;
      }
      outside.push({ x, y });
    }
  }
  const rooms: Room[] = placed.map((room) => {
    const rects = placedRects(room);
    const [first, ...rest] = rects;
    return {
      id: room.id,
      role: room.role,
      x: first?.x ?? room.x,
      y: first?.y ?? room.y,
      width: first?.width ?? room.w,
      height: first?.height ?? room.h,
      ...(rest.length > 0 ? { parts: rest } : {}),
    };
  });
  return {
    width,
    height,
    rooms,
    walls: sharedWalls(rooms),
    openings: [],
    ...(outside.length > 0 ? { outside } : {}),
  };
}

function sharedWalls(rooms: Room[]): SharedWall[] {
  const walls: SharedWall[] = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      if (!a || !b) {
        continue;
      }
      const cells = gapCells(a, b);
      if (cells.length === 0) {
        continue;
      }
      const vertical = cells.every((cell, index) => index === 0 || cell.x === cells[0]?.x);
      walls.push({
        id: `${a.id}-${b.id}`,
        orientation: vertical ? 'vertical' : 'horizontal',
        a: [vertical ? leftRoom(a, b) : aboveRoom(a, b)],
        b: [vertical ? rightRoom(a, b) : belowRoom(a, b)],
        cells,
      });
    }
  }
  return walls;
}

function gapCells(a: Room, b: Room): TileCoord[] {
  const cells: TileCoord[] = [];
  for (const left of placedRoomRects(a)) {
    for (const right of placedRoomRects(b)) {
      if (left.x + left.width + 1 === right.x) {
        pushSpan(
          cells,
          right.x - 1,
          overlap(left.y, left.y + left.height, right.y, right.y + right.height),
          'vertical',
        );
      } else if (right.x + right.width + 1 === left.x) {
        pushSpan(
          cells,
          left.x - 1,
          overlap(left.y, left.y + left.height, right.y, right.y + right.height),
          'vertical',
        );
      } else if (left.y + left.height + 1 === right.y) {
        pushSpan(
          cells,
          right.y - 1,
          overlap(left.x, left.x + left.width, right.x, right.x + right.width),
          'horizontal',
        );
      } else if (right.y + right.height + 1 === left.y) {
        pushSpan(
          cells,
          left.y - 1,
          overlap(left.x, left.x + left.width, right.x, right.x + right.width),
          'horizontal',
        );
      }
    }
  }
  cells.sort((p, q) => p.y - q.y || p.x - q.x);
  return cells;
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

function leftRoom(a: Room, b: Room): string {
  return a.x <= b.x ? a.id : b.id;
}

function rightRoom(a: Room, b: Room): string {
  return a.x <= b.x ? b.id : a.id;
}

function aboveRoom(a: Room, b: Room): string {
  return a.y <= b.y ? a.id : b.id;
}

function belowRoom(a: Room, b: Room): string {
  return a.y <= b.y ? b.id : a.id;
}

function placedRects(room: Placed): RoomPart[] {
  return [{ x: room.x, y: room.y, width: room.w, height: room.h }, ...(room.parts ?? [])];
}

function placedRoomRects(room: Room): RoomPart[] {
  return [{ x: room.x, y: room.y, width: room.width, height: room.height }, ...(room.parts ?? [])];
}

function roomArea(room: Placed): number {
  return placedRects(room).reduce((sum, part) => sum + part.width * part.height, 0);
}

function floorTiles(placed: Placed[]): number {
  return placed.reduce((sum, room) => sum + roomArea(room), 0);
}

function splitHeights(weights: number[], span: number): number[] | null {
  const count = weights.length;
  if (count === 0) {
    return [];
  }
  const floor = span - (count - 1);
  if (floor < count * MIN_SIDE) {
    return null;
  }
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const heights = weights.map((weight) =>
    Math.max(MIN_SIDE, Math.round((floor * weight) / weightSum)),
  );
  let delta = floor - heights.reduce((sum, height) => sum + height, 0);
  let guard = 0;
  while (delta !== 0 && guard < 100) {
    guard += 1;
    if (delta > 0) {
      let index = 0;
      heights.forEach((height, cursor) => {
        if (height > (heights[index] ?? 0)) {
          index = cursor;
        }
      });
      const current = heights[index];
      if (current === undefined) {
        return null;
      }
      heights[index] = current + 1;
      delta -= 1;
      continue;
    }
    let index = -1;
    heights.forEach((height, cursor) => {
      if (height > MIN_SIDE && (index < 0 || height > (heights[index] ?? 0))) {
        index = cursor;
      }
    });
    if (index < 0) {
      return null;
    }
    const current = heights[index];
    if (current === undefined) {
      return null;
    }
    heights[index] = current - 1;
    delta += 1;
  }
  return delta === 0 ? heights : null;
}

function aspectOk(room: ProgramRoom, width: number, height: number): boolean {
  if (width < MIN_SIDE || height < MIN_SIDE) {
    return false;
  }
  const aspect = Math.max(width, height) / Math.min(width, height);
  return aspect >= room.minAspect - 0.05 && aspect <= room.maxAspect + 0.05;
}

function fitRect(area: number, minAspect: number, maxAspect: number): { w: number; h: number } {
  let best = { w: MIN_SIDE, h: MIN_SIDE, score: Number.POSITIVE_INFINITY };
  for (let h = MIN_SIDE; h <= Math.max(MIN_SIDE, Math.ceil(area / MIN_SIDE)); h++) {
    const w = Math.max(MIN_SIDE, Math.round(area / h));
    const aspect = Math.max(w, h) / Math.min(w, h);
    const aspectPenalty = aspect < minAspect || aspect > maxAspect ? 1000 : 0;
    const score = Math.abs(w * h - area) + aspectPenalty;
    if (score < best.score) {
      best = { w, h, score };
    }
  }
  return best;
}

function range(start: number, end: number): number[] {
  const values: number[] = [];
  for (let value = start; value <= end; value++) {
    values.push(value);
  }
  return values;
}
