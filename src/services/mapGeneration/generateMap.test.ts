import { describe, expect, it } from 'vitest';
import { tiles } from '../../assets/tileSet/tileSet';
import { cellAt, gridIssues, type TileCoord } from '../../types/map';
import { generateMap } from './generateMap';

function structId(action: 'floor' | 'wall' | 'door', name?: string): string {
  const tile = tiles.find(
    (candidate) =>
      candidate.type === 'struct' &&
      candidate.actAs?.action === action &&
      (name === undefined || candidate.name === name),
  );
  if (!tile) {
    throw new Error(`missing ${name ?? action}`);
  }
  return tile.id;
}

function idAt(
  width: number,
  height: number,
  cells: Uint16Array,
  palette: readonly string[],
  cell: TileCoord,
): string | null {
  const index = cellAt(width, height, cells, cell.x, cell.y);
  if (index === 0) {
    return null;
  }
  return palette[index] ?? null;
}

describe('generateMap', () => {
  it('stamps floor, wall, and door from the first matching struct tiles', () => {
    const result = generateMap({
      parameters: { areaSquareFeet: 2000, roomCount: 1, buildingType: 'residential' },
      tiles,
      seed: 'stamp',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const { map } = result;
    const { width, height } = map.layout;
    expect(map.generatorId).toBe('program-v1');
    expect(map.palette).toEqual(['', structId('floor'), structId('wall'), structId('door')]);
    expect(map.cells).toHaveLength(width * height);
    expect(gridIssues(width, height, map.palette, map.cells)).toEqual([]);
    expect(idAt(width, height, map.cells, map.palette, { x: 0, y: 0 })).toBe(structId('wall'));

    const room = map.layout.rooms[0];
    expect(room).toBeDefined();
    if (!room) {
      return;
    }
    expect(idAt(width, height, map.cells, map.palette, { x: room.x, y: room.y })).toBe(
      structId('floor'),
    );

    const entrance = map.layout.openings[0];
    expect(entrance?.cells).toHaveLength(1);
    const doorCell = entrance?.cells[0];
    expect(doorCell).toBeDefined();
    if (!doorCell) {
      return;
    }
    expect(idAt(width, height, map.cells, map.palette, doorCell)).toBe(structId('door'));
    expect(map.interiorTiles).toBe(room.width * room.height);
    const shelf = tiles.find((tile) => tile.name === 'Shelf 1');
    expect(shelf).toBeDefined();
    expect(map.palette.includes(shelf?.id ?? '')).toBe(false);
  });

  it('uses a named floor tile and turns commercial passages into floor', () => {
    const floorId = structId('floor', 'Floor 2');
    const result = generateMap({
      parameters: { areaSquareFeet: 2000, roomCount: 1, buildingType: 'commercial' },
      tiles,
      seed: 'passage',
      stamp: { floor: floorId },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const { map } = result;
    const entrance = map.layout.openings.find((opening) => opening.kind === 'passage');
    expect(entrance).toBeDefined();
    if (!entrance) {
      return;
    }
    for (const cell of entrance.cells) {
      expect(idAt(map.layout.width, map.layout.height, map.cells, map.palette, cell)).toBe(floorId);
    }
    expect(map.palette.includes(structId('door'))).toBe(false);
    const roomTiles = map.layout.rooms.reduce((sum, room) => sum + room.width * room.height, 0);
    expect(map.interiorTiles).toBe(roomTiles + entrance.cells.length);
  });

  it('rejects a catalog with no floor tile and an unknown generator', () => {
    const wallsOnly = tiles.filter((tile) => tile.actAs?.action !== 'floor');
    const missing = generateMap({
      parameters: { areaSquareFeet: 2000, roomCount: 1, buildingType: 'residential' },
      tiles: wallsOnly,
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.errors).toContain('catalog has no floor tile');
    }

    const unknown = generateMap({
      parameters: { areaSquareFeet: 2000, roomCount: 1, buildingType: 'residential' },
      tiles,
      generatorId: 'other',
    });
    expect(unknown).toEqual({ ok: false, errors: ['unknown generator other'] });
  });

  it('stamps an adjacency plan and still accepts bsp-v1', () => {
    const adjacency = generateMap({
      parameters: { areaSquareFeet: 2000, roomCount: 4, buildingType: 'residential' },
      tiles,
      seed: 'graph',
      generatorId: 'adjacency-v1',
    });
    expect(adjacency.ok).toBe(true);
    if (!adjacency.ok) {
      return;
    }
    expect(adjacency.map.generatorId).toBe('adjacency-v1');
    expect(
      gridIssues(
        adjacency.map.layout.width,
        adjacency.map.layout.height,
        adjacency.map.palette,
        adjacency.map.cells,
      ),
    ).toEqual([]);
    const entrance = adjacency.map.layout.openings.find((opening) => opening.id === 'entrance');
    const doorCell = entrance?.cells[0];
    expect(doorCell).toBeDefined();
    if (!doorCell) {
      return;
    }
    expect(
      idAt(
        adjacency.map.layout.width,
        adjacency.map.layout.height,
        adjacency.map.cells,
        adjacency.map.palette,
        doorCell,
      ),
    ).toBe(structId('door'));

    const bsp = generateMap({
      parameters: { areaSquareFeet: 2000, roomCount: 1, buildingType: 'residential' },
      tiles,
      seed: 'legacy',
      generatorId: 'bsp-v1',
    });
    expect(bsp.ok).toBe(true);
    if (bsp.ok) {
      expect(bsp.map.generatorId).toBe('bsp-v1');
      expect(
        gridIssues(bsp.map.layout.width, bsp.map.layout.height, bsp.map.palette, bsp.map.cells),
      ).toEqual([]);
    }
  });
});
