import { describe, expect, it } from 'vitest';
import { layoutIssues, type MapLayout, type Room, type SharedWall } from '../../types/map';
import { generateBspLayout, interiorTileTarget } from './generateBspLayout';
import { roomsConnected } from './planOpenings';

function roomsTouching(layout: MapLayout, wall: SharedWall): { a: Set<string>; b: Set<string> } {
  const a = new Set<string>();
  const b = new Set<string>();
  for (const cell of wall.cells) {
    const neighbors =
      wall.orientation === 'vertical'
        ? [
            { side: a, x: cell.x - 1, y: cell.y },
            { side: b, x: cell.x + 1, y: cell.y },
          ]
        : [
            { side: a, x: cell.x, y: cell.y - 1 },
            { side: b, x: cell.x, y: cell.y + 1 },
          ];
    for (const neighbor of neighbors) {
      const room = layout.rooms.find(
        (candidate) =>
          neighbor.x >= candidate.x &&
          neighbor.y >= candidate.y &&
          neighbor.x < candidate.x + candidate.width &&
          neighbor.y < candidate.y + candidate.height,
      );
      if (room) {
        neighbor.side.add(room.id);
      }
    }
  }
  return { a, b };
}

function expectShell(layout: MapLayout, room: Room): void {
  expect(room.x).toBeGreaterThanOrEqual(1);
  expect(room.y).toBeGreaterThanOrEqual(1);
  expect(room.x + room.width).toBeLessThanOrEqual(layout.width - 1);
  expect(room.y + room.height).toBeLessThanOrEqual(layout.height - 1);
  expect(room.width).toBeGreaterThanOrEqual(3);
  expect(room.height).toBeGreaterThanOrEqual(3);
}

describe('generateBspLayout', () => {
  it('rejects a room count or area the footprint cannot hold', () => {
    expect(
      generateBspLayout({ areaSquareFeet: 2000, roomCount: 0, buildingType: 'residential' }),
    ).toEqual({
      ok: false,
      errors: ['roomCount must be a positive integer'],
    });
    expect(
      generateBspLayout({ areaSquareFeet: -5, roomCount: 1, buildingType: 'residential' }).ok,
    ).toBe(false);
    const tooSmall = generateBspLayout({
      areaSquareFeet: 100,
      roomCount: 2,
      buildingType: 'residential',
    });
    expect(tooSmall).toEqual({ ok: false, errors: ['area is too small for 2 rooms'] });
    expect(interiorTileTarget(100)).toBe(9);
  });

  it('builds one residential room inside a one-tile shell', () => {
    const result = generateBspLayout({
      areaSquareFeet: 2000,
      roomCount: 1,
      buildingType: 'residential',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.interiorTiles).toBe(196);
    expect(result.layout.rooms).toHaveLength(1);
    expect(result.layout.walls).toEqual([]);
    expect(result.layout.openings).toHaveLength(1);
    expect(result.layout.openings[0]?.kind).toBe('door');
    expect(result.layout.openings[0]?.b).toBeNull();
    expect(result.layout.openings[0]?.cells).toHaveLength(1);
    expect(result.layout.width).toBe(result.layout.height);
    expect(result.layout.width).toBeLessThanOrEqual(1024);
    expect(layoutIssues(result.layout)).toEqual([]);
    expectShell(result.layout, result.layout.rooms[0] as Room);
  });

  it('splits two rooms with one shared wall', () => {
    const result = generateBspLayout(
      { areaSquareFeet: 194, roomCount: 2, buildingType: 'residential' },
      'seed-a',
    );
    const again = generateBspLayout(
      { areaSquareFeet: 194, roomCount: 2, buildingType: 'residential' },
      'seed-a',
    );
    expect(result).toEqual(again);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.interiorTiles).toBe(18);
    expect(result.layout.rooms).toHaveLength(2);
    expect(result.layout.walls).toHaveLength(1);
    expect(result.layout.openings).toHaveLength(2);
    expect(result.layout.openings.every((opening) => opening.kind === 'door')).toBe(true);
    expect(result.layout.openings.some((opening) => opening.b === null)).toBe(true);
    expect(roomsConnected(result.layout.rooms, result.layout.openings)).toBe(true);
    expect(layoutIssues(result.layout)).toEqual([]);

    const wall = result.layout.walls[0] as SharedWall;
    expect(wall.cells.length).toBeGreaterThan(0);
    const xs = new Set(wall.cells.map((cell) => cell.x));
    const ys = new Set(wall.cells.map((cell) => cell.y));
    expect(xs.size === 1 || ys.size === 1).toBe(true);

    for (const room of result.layout.rooms) {
      expectShell(result.layout, room);
    }
    const touching = roomsTouching(result.layout, wall);
    expect([...touching.a].sort()).toEqual([...wall.a].sort());
    expect([...touching.b].sort()).toEqual([...wall.b].sort());
  });

  it('cuts four rooms whose floor area matches the request', () => {
    const result = generateBspLayout({
      areaSquareFeet: 388,
      roomCount: 4,
      buildingType: 'residential',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.layout.rooms).toHaveLength(4);
    expect(result.layout.walls).toHaveLength(3);
    expect(result.layout.openings.filter((opening) => opening.b === null)).toHaveLength(1);
    expect(result.layout.openings.filter((opening) => opening.a && opening.b)).toHaveLength(3);
    expect(result.interiorTiles).toBe(36);
    expect(roomsConnected(result.layout.rooms, result.layout.openings)).toBe(true);
    expect(layoutIssues(result.layout)).toEqual([]);
    for (const room of result.layout.rooms) {
      expectShell(result.layout, room);
    }
  });

  it('makes a commercial building wider than it is tall', () => {
    const result = generateBspLayout({
      areaSquareFeet: 2000,
      roomCount: 1,
      buildingType: 'commercial',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.layout.width).toBeGreaterThan(result.layout.height);
    expect(result.interiorTiles).toBeGreaterThanOrEqual(186 - 19);
    expect(result.interiorTiles).toBeLessThanOrEqual(186 + 19);
    const entrance = result.layout.openings.find((opening) => opening.b === null);
    expect(entrance?.kind).toBe('passage');
    expect(entrance?.cells.length).toBeGreaterThanOrEqual(2);
    expect(
      entrance?.cells.every((cell) => cell.y === 0 || cell.y === result.layout.height - 1),
    ).toBe(true);
  });

  it('places the door on different cells when the seed changes', () => {
    const cells = new Set<string>();
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const result = generateBspLayout(
        { areaSquareFeet: 194, roomCount: 2, buildingType: 'residential' },
        seed,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      const door = result.layout.openings.find((opening) => opening.a && opening.b);
      const cell = door?.cells[0];
      if (cell) {
        cells.add(`${cell.x},${cell.y}`);
      }
    }
    expect(cells.size).toBeGreaterThan(1);
  });

  it('refuses an area that cannot fit inside 1024×1024', () => {
    const result = generateBspLayout({
      areaSquareFeet: 1_000_000_000,
      roomCount: 1,
      buildingType: 'residential',
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errors[0]).toContain('1024×1024');
  });
});
