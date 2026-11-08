import { cellIndex, roomRects, type MapLayout, type TileCoord } from '../../types/map';
import type { Tile } from '../../types/tile';

export interface StructStamp {
  floor?: string;
  wall?: string;
  door?: string;
}

export interface StructGrid {
  palette: string[];
  cells: Uint16Array;
  /** Cells stamped as floor, including passages. */
  interiorTiles: number;
}

type StructAction = 'floor' | 'wall' | 'door';

const UNSET = 0;
const FLOOR = 1;
const WALL = 2;
const DOOR = 3;
const OUTSIDE = 4;

function structTiles(tiles: readonly Tile[], action: StructAction): Tile[] {
  return tiles.filter((tile) => tile.type === 'struct' && tile.actAs?.action === action);
}

function resolveTile(
  tiles: readonly Tile[],
  action: StructAction,
  id: string | undefined,
  errors: string[],
): string | null {
  if (id === undefined) {
    const match = structTiles(tiles, action)[0];
    if (!match) {
      errors.push(`catalog has no ${action} tile`);
      return null;
    }
    return match.id;
  }
  const match = tiles.find((tile) => tile.id === id);
  if (!match || match.type !== 'struct' || match.actAs?.action !== action) {
    errors.push(`${action} tile ${id} is not a struct ${action}`);
    return null;
  }
  return match.id;
}

function claim(
  roles: Uint8Array,
  width: number,
  cell: TileCoord,
  role: number,
  expected: number,
  errors: string[],
): void {
  if (cell.x < 0 || cell.y < 0) {
    errors.push(`cell (${cell.x},${cell.y}) is outside the map`);
    return;
  }
  const index = cellIndex(width, cell.x, cell.y);
  if (index >= roles.length || roles[index] !== expected) {
    errors.push(`cell (${cell.x},${cell.y}) is not part of the building`);
    return;
  }
  roles[index] = role;
}

/**
 * Stamp struct tiles from a finished layout.
 * Rooms and passages become floor. Solid walls stay walls. Door openings become doors.
 * Index 0 stays empty. Later indexes are catalog ids in the order floor, wall, door.
 */
export function rasterizeStruct(
  layout: MapLayout,
  tiles: readonly Tile[],
  stamp: StructStamp = {},
): { ok: true; grid: StructGrid } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const floorId = resolveTile(tiles, 'floor', stamp.floor, errors);
  const wallId = resolveTile(tiles, 'wall', stamp.wall, errors);
  const needsDoor = layout.openings.some((opening) => opening.kind === 'door');
  const doorId = needsDoor ? resolveTile(tiles, 'door', stamp.door, errors) : null;
  if (!floorId || !wallId || (needsDoor && !doorId) || errors.length > 0) {
    return { ok: false, errors };
  }

  const { width, height } = layout;
  const roles = new Uint8Array(width * height);
  const hasOutside = (layout.outside?.length ?? 0) > 0;
  if (!hasOutside) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          roles[cellIndex(width, x, y)] = WALL;
        }
      }
    }
  } else {
    for (const cell of layout.outside ?? []) {
      if (cell.x < 0 || cell.y < 0 || cell.x >= width || cell.y >= height) {
        errors.push(`cell (${cell.x},${cell.y}) is outside the map`);
        continue;
      }
      roles[cellIndex(width, cell.x, cell.y)] = OUTSIDE;
    }
  }

  for (const room of layout.rooms) {
    for (const part of roomRects(room)) {
      for (let y = part.y; y < part.y + part.height; y++) {
        for (let x = part.x; x < part.x + part.width; x++) {
          claim(roles, width, { x, y }, FLOOR, UNSET, errors);
        }
      }
    }
  }

  for (const wall of layout.walls) {
    for (const cell of wall.cells) {
      claim(roles, width, cell, WALL, UNSET, errors);
    }
  }

  promoteShell(roles, width, height);

  for (const opening of layout.openings) {
    const role = opening.kind === 'door' ? DOOR : FLOOR;
    for (const cell of opening.cells) {
      claim(roles, width, cell, role, WALL, errors);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = cellIndex(width, x, y);
      if (roles[index] === UNSET) {
        roles[index] = OUTSIDE;
      }
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const palette = ['', floorId, wallId];
  if (doorId) {
    palette.push(doorId);
  }
  const cells = new Uint16Array(roles.length);
  let interiorTiles = 0;
  for (let index = 0; index < roles.length; index++) {
    const role = roles[index];
    if (role === FLOOR) {
      cells[index] = 1;
      interiorTiles += 1;
    } else if (role === WALL) {
      cells[index] = 2;
    } else if (role === DOOR) {
      cells[index] = 3;
    }
  }

  return { ok: true, grid: { palette, cells, interiorTiles } };
}

function promoteShell(roles: Uint8Array, width: number, height: number): void {
  const adjacent = (x: number, y: number, role: number) => {
    const neighbors: Array<[number, number]> = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    return neighbors.some(([nx, ny]) => {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        return false;
      }
      return roles[cellIndex(width, nx, ny)] === role;
    });
  };
  const paint = (predicate: (x: number, y: number, index: number) => boolean) => {
    const indexes: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = cellIndex(width, x, y);
        if (predicate(x, y, index)) {
          indexes.push(index);
        }
      }
    }
    for (const index of indexes) {
      roles[index] = WALL;
    }
  };
  paint((x, y, index) => roles[index] === UNSET && adjacent(x, y, FLOOR));
  paint((x, y, index) => {
    if (roles[index] !== UNSET && roles[index] !== OUTSIDE) {
      return false;
    }
    const corners: Array<[number, number]> = [
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
      [x + 1, y + 1],
    ];
    return corners.some(([nx, ny]) => {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        return false;
      }
      return roles[cellIndex(width, nx, ny)] === FLOOR;
    });
  });
  paint(
    (x, y, index) =>
      roles[index] === UNSET &&
      (x === 0 || y === 0 || x === width - 1 || y === height - 1) &&
      adjacent(x, y, WALL),
  );
}
