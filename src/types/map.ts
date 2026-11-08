/** Largest bounding box edge, in tiles. */
export const MAP_MAX_EDGE = 1024;

/** Palette index for a cell outside the building. */
export const EMPTY_CELL = 0;

export type BuildingType = 'residential' | 'commercial';

export interface MapParameters {
  areaSquareFeet: number;
  roomCount: number;
  buildingType: BuildingType;
}

export interface TileCoord {
  x: number;
  y: number;
}

/** Interior rectangle. Excludes the surrounding wall. */
export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Set by an adjacency template, such as `hall` or `sales`. */
  role?: string;
}

/** A one-tile cut between two groups of rooms. Each cut gets one opening. */
export interface SharedWall {
  id: string;
  orientation: 'vertical' | 'horizontal';
  /** Rooms on the left of a vertical wall, or above a horizontal wall. */
  a: string[];
  /** Rooms on the right of a vertical wall, or below a horizontal wall. */
  b: string[];
  cells: TileCoord[];
}

export type OpeningKind = 'door' | 'passage';

export interface Opening {
  id: string;
  kind: OpeningKind;
  /** Rooms on each side. One is null for the exterior entrance. */
  a: string | null;
  b: string | null;
  /** Wall cells this opening replaces, in order. */
  cells: TileCoord[];
}

export interface MapLayout {
  width: number;
  height: number;
  rooms: Room[];
  walls: SharedWall[];
  openings: Opening[];
}

export interface GeneratedMap {
  parameters: MapParameters;
  seed: string;
  generatorId: string;
  /** Interior floor tiles actually placed. */
  interiorTiles: number;
  layout: MapLayout;
  /**
   * Catalog tile ids. Index 0 is unused.
   * A cell value `n > 0` selects `palette[n]`.
   */
  palette: readonly string[];
  /** Length `width * height`. `0` is outside the building. */
  cells: Uint16Array;
}

export function cellIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

export function cellAt(
  width: number,
  height: number,
  cells: Uint16Array,
  x: number,
  y: number,
): number {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return EMPTY_CELL;
  }
  return cells[cellIndex(width, x, y)] ?? EMPTY_CELL;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function edgeIssue(name: string, value: number): string | null {
  if (!isPositiveInteger(value) || value > MAP_MAX_EDGE) {
    return `${name} must be an integer from 1 to ${MAP_MAX_EDGE}`;
  }
  return null;
}

function roomContains(room: Room, x: number, y: number): boolean {
  return x >= room.x && y >= room.y && x < room.x + room.width && y < room.y + room.height;
}

function rectanglesOverlap(a: Room, b: Room): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function touchesRoom(room: Room, x: number, y: number): boolean {
  return (
    roomContains(room, x - 1, y) ||
    roomContains(room, x + 1, y) ||
    roomContains(room, x, y - 1) ||
    roomContains(room, x, y + 1)
  );
}

function inBounds(layout: MapLayout, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < layout.width && y < layout.height;
}

function isInterior(rooms: readonly Room[], x: number, y: number): boolean {
  return rooms.some((room) => roomContains(room, x, y));
}

/** A wall cell touches a room and is not itself interior. */
function isWallCell(layout: MapLayout, x: number, y: number): boolean {
  if (!inBounds(layout, x, y) || isInterior(layout.rooms, x, y)) {
    return false;
  }
  return layout.rooms.some((room) => touchesRoom(room, x, y));
}

/**
 * Bounds, disjoint interiors, and openings that sit on wall cells.
 * An empty list means the layout satisfies those checks.
 */
export function layoutIssues(layout: MapLayout): string[] {
  const issues: string[] = [];
  const widthIssue = edgeIssue('width', layout.width);
  const heightIssue = edgeIssue('height', layout.height);
  if (widthIssue) {
    issues.push(widthIssue);
  }
  if (heightIssue) {
    issues.push(heightIssue);
  }

  const seenIds = new Set<string>();
  const rooms: Room[] = [];
  for (const room of layout.rooms) {
    if (seenIds.has(room.id)) {
      issues.push(`duplicate room id ${room.id}`);
      continue;
    }
    seenIds.add(room.id);
    if (
      !Number.isInteger(room.x) ||
      !Number.isInteger(room.y) ||
      !isPositiveInteger(room.width) ||
      !isPositiveInteger(room.height)
    ) {
      issues.push(`room ${room.id} must have an integer origin and a positive integer size`);
      continue;
    }
    if (
      room.x < 0 ||
      room.y < 0 ||
      room.x + room.width > layout.width ||
      room.y + room.height > layout.height
    ) {
      issues.push(`room ${room.id} is outside the map`);
      continue;
    }
    rooms.push(room);
  }

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const left = rooms[i];
      const right = rooms[j];
      if (left && right && rectanglesOverlap(left, right)) {
        issues.push(`room ${left.id} overlaps ${right.id}`);
      }
    }
  }

  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const usedCells = new Set<string>();
  for (const opening of layout.openings) {
    const named = [opening.a, opening.b].filter((id): id is string => id != null);
    if (named.length === 0) {
      issues.push(`opening ${opening.id} must name a room`);
    }
    for (const roomId of named) {
      if (!roomsById.has(roomId)) {
        issues.push(`opening ${opening.id} references unknown room ${roomId}`);
      }
    }
    if (opening.cells.length === 0) {
      issues.push(`opening ${opening.id} has no cells`);
    }
    if (opening.kind === 'door' && opening.cells.length !== 1) {
      issues.push(`opening ${opening.id} door must cover one cell`);
    }
    for (const cell of opening.cells) {
      const key = `${cell.x},${cell.y}`;
      if (usedCells.has(key)) {
        issues.push(`opening ${opening.id} reuses cell (${cell.x},${cell.y})`);
      }
      usedCells.add(key);
      const onWall =
        Number.isInteger(cell.x) && Number.isInteger(cell.y) && isWallCell(layout, cell.x, cell.y);
      if (!onWall) {
        issues.push(`opening ${opening.id} cell (${cell.x},${cell.y}) is not a wall`);
        continue;
      }
      for (const roomId of named) {
        const room = roomsById.get(roomId);
        if (room && !touchesRoom(room, cell.x, cell.y)) {
          issues.push(
            `opening ${opening.id} cell (${cell.x},${cell.y}) does not touch room ${roomId}`,
          );
        }
      }
    }
  }

  return issues;
}

/** Palette index 0 is unused, and every cell index has to land in the palette. */
export function gridIssues(
  width: number,
  height: number,
  palette: readonly string[],
  cells: Uint16Array,
): string[] {
  const issues: string[] = [];
  if (palette[0] !== '') {
    issues.push('palette[0] must be an empty string');
  }
  for (let index = 1; index < palette.length; index++) {
    if (palette[index] === '') {
      issues.push(`palette[${index}] must be a tile id`);
    }
  }
  const expected = width * height;
  if (cells.length !== expected) {
    issues.push(`cells length must be ${expected}`);
  }
  const limit = Math.min(cells.length, expected);
  for (let index = 0; index < limit; index++) {
    const value = cells[index] ?? 0;
    if (value >= palette.length) {
      issues.push(`cell ${index} index ${value} is outside the palette`);
      break;
    }
  }
  return issues;
}
