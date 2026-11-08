import type {
  BuildingType,
  MapLayout,
  Opening,
  Room,
  SharedWall,
  TileCoord,
} from '../../types/map';
import { openingKind } from './buildingTypeProfile';
import type { RandomSource } from './randomSource';

interface RoomRun {
  a: string;
  b: string | null;
  cells: TileCoord[];
}

type Side = 'north' | 'south' | 'west' | 'east';

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

function roomAt(rooms: readonly Room[], x: number, y: number): string | null {
  const room = rooms.find(
    (candidate) =>
      x >= candidate.x &&
      y >= candidate.y &&
      x < candidate.x + candidate.width &&
      y < candidate.y + candidate.height,
  );
  return room?.id ?? null;
}

function sideRoom(
  rooms: readonly Room[],
  wall: SharedWall,
  cell: TileCoord,
  side: 'a' | 'b',
): string | null {
  const x = cell.x + (wall.orientation === 'vertical' ? (side === 'a' ? -1 : 1) : 0);
  const y = cell.y + (wall.orientation === 'horizontal' ? (side === 'a' ? -1 : 1) : 0);
  return roomAt(rooms, x, y);
}

/** A passage stays shorter than the wall it cuts. A door is one cell. */
export function openingLength(kind: Opening['kind'], runLength: number): number {
  if (kind === 'door' || runLength < 3) {
    return 1;
  }
  if (runLength < 5) {
    return 2;
  }
  return 3;
}

function windowOn(cells: readonly TileCoord[], length: number, rng: RandomSource): TileCoord[] {
  const lastStart = cells.length - length;
  const start = lastStart > 0 ? rng.int(0, lastStart) : 0;
  return cells.slice(start, start + length);
}

function chooseRun(runs: readonly RoomRun[], rng: RandomSource): RoomRun | null {
  if (runs.length === 0) {
    return null;
  }
  const longest = Math.max(...runs.map((run) => run.cells.length));
  const ties = runs.filter((run) => run.cells.length === longest);
  return shuffle(ties, rng)[0] ?? null;
}

function sharedRuns(rooms: readonly Room[], wall: SharedWall): RoomRun[] {
  const runs: RoomRun[] = [];
  let current: RoomRun | null = null;
  for (const cell of wall.cells) {
    const a = sideRoom(rooms, wall, cell, 'a');
    const b = sideRoom(rooms, wall, cell, 'b');
    if (!a || !b) {
      current = null;
      continue;
    }
    if (current && current.a === a && current.b === b) {
      current.cells.push(cell);
      continue;
    }
    current = { a, b, cells: [cell] };
    runs.push(current);
  }
  return runs;
}

function sideCoords(layout: MapLayout, side: Side): TileCoord[] {
  const cells: TileCoord[] = [];
  if (side === 'north' || side === 'south') {
    const y = side === 'north' ? 0 : layout.height - 1;
    for (let x = 0; x < layout.width; x++) {
      cells.push({ x, y });
    }
    return cells;
  }
  const x = side === 'west' ? 0 : layout.width - 1;
  for (let y = 0; y < layout.height; y++) {
    cells.push({ x, y });
  }
  return cells;
}

function inward(side: Side): { x: number; y: number } {
  if (side === 'north') {
    return { x: 0, y: 1 };
  }
  if (side === 'south') {
    return { x: 0, y: -1 };
  }
  if (side === 'west') {
    return { x: 1, y: 0 };
  }
  return { x: -1, y: 0 };
}

function exteriorRuns(layout: MapLayout, side: Side): RoomRun[] {
  const step = inward(side);
  const runs: RoomRun[] = [];
  let current: RoomRun | null = null;
  for (const cell of sideCoords(layout, side)) {
    const roomId = roomAt(layout.rooms, cell.x + step.x, cell.y + step.y);
    if (!roomId) {
      current = null;
      continue;
    }
    if (current && current.a === roomId) {
      current.cells.push(cell);
      continue;
    }
    current = { a: roomId, b: null, cells: [cell] };
    runs.push(current);
  }
  return runs;
}

function longSides(layout: MapLayout): Side[] {
  if (layout.width === layout.height) {
    return ['north', 'south', 'west', 'east'];
  }
  return layout.width > layout.height ? ['north', 'south'] : ['west', 'east'];
}

function openingOn(run: RoomRun, kind: Opening['kind'], id: string, rng: RandomSource): Opening {
  const length = openingLength(kind, run.cells.length);
  return { id, kind, a: run.a, b: run.b, cells: windowOn(run.cells, length, rng) };
}

/** Every room can be reached from every other room through internal openings. */
export function roomsConnected(rooms: readonly Room[], openings: readonly Opening[]): boolean {
  const first = rooms[0];
  if (!first) {
    return true;
  }
  const neighbors = new Map<string, string[]>(rooms.map((room) => [room.id, []]));
  for (const opening of openings) {
    if (!opening.a || !opening.b) {
      continue;
    }
    neighbors.get(opening.a)?.push(opening.b);
    neighbors.get(opening.b)?.push(opening.a);
  }
  const seen = new Set<string>();
  const pending = [first.id];
  while (pending.length > 0) {
    const id = pending.pop();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    pending.push(...(neighbors.get(id) ?? []));
  }
  return seen.size === rooms.length;
}

export function planOpenings(
  layout: MapLayout,
  buildingType: BuildingType,
  rng: RandomSource,
  options?: { entranceRoomId?: string },
): { openings: Opening[]; errors: string[] } {
  const kind = openingKind(buildingType);
  const openings: Opening[] = [];
  const errors: string[] = [];

  for (const wall of layout.walls) {
    const run = chooseRun(sharedRuns(layout.rooms, wall), rng);
    if (!run) {
      errors.push(`wall ${wall.id} has no place for an opening`);
      continue;
    }
    openings.push(openingOn(run, kind, `opening-${wall.id}`, rng));
  }

  const sides =
    buildingType === 'commercial'
      ? longSides(layout)
      : (['north', 'south', 'west', 'east'] as const);
  const entranceRuns = sides.flatMap((side) => exteriorRuns(layout, side));
  const preferred = options?.entranceRoomId;
  const eligible = preferred ? entranceRuns.filter((run) => run.a === preferred) : entranceRuns;
  const entranceRun = chooseRun(eligible, rng);
  if (!entranceRun) {
    errors.push(
      preferred ? `entrance cannot open into ${preferred}` : 'building has no exterior entrance',
    );
  } else {
    openings.push(openingOn(entranceRun, kind, 'entrance', rng));
  }

  if (errors.length === 0 && !roomsConnected(layout.rooms, openings)) {
    errors.push('rooms are not connected by openings');
  }

  return { openings, errors };
}
