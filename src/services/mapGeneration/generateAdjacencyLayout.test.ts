import { describe, expect, it } from 'vitest';
import { layoutIssues, type MapLayout, type Room } from '../../types/map';
import { areaTolerance, interiorTileTarget } from './generateBspLayout';
import { generateAdjacencyLayout } from './generateAdjacencyLayout';
import { roomsConnected } from './planOpenings';

function room(layout: MapLayout, role: string): Room {
  const found = layout.rooms.find((candidate) => candidate.role === role);
  if (!found) {
    throw new Error(`missing ${role}`);
  }
  return found;
}

function sharesWall(layout: MapLayout, a: string, b: string): boolean {
  return layout.walls.some((wall) => {
    const ids = new Set([...wall.a, ...wall.b]);
    return ids.has(a) && ids.has(b);
  });
}

describe('generateAdjacencyLayout', () => {
  it('rejects a bad room count, a building that cannot pay for the hall, and a 1024 overflow', () => {
    expect(
      generateAdjacencyLayout({
        areaSquareFeet: 2000,
        roomCount: 0,
        buildingType: 'residential',
      }),
    ).toEqual({ ok: false, errors: ['roomCount must be a positive integer'] });

    const tooSmall = generateAdjacencyLayout({
      areaSquareFeet: 400,
      roomCount: 4,
      buildingType: 'residential',
    });
    expect(tooSmall.ok).toBe(false);
    if (!tooSmall.ok) {
      expect(tooSmall.errors[0]).toContain('too small');
    }

    const huge = generateAdjacencyLayout({
      areaSquareFeet: 1e9,
      roomCount: 1,
      buildingType: 'residential',
    });
    expect(huge.ok).toBe(false);
    if (!huge.ok) {
      expect(huge.errors[0]).toContain('1024×1024');
    }
  });

  it('puts every residential room on a hall and opens the entrance into that hall', () => {
    const result = generateAdjacencyLayout(
      { areaSquareFeet: 2000, roomCount: 4, buildingType: 'residential' },
      'house',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const { layout } = result;
    const hall = room(layout, 'hall');
    const privates = layout.rooms.filter((candidate) => candidate.role === 'private');
    expect(result.generatorId).toBe('adjacency-v1');
    expect(layout.rooms).toHaveLength(4);
    expect(privates).toHaveLength(3);
    expect(hall.id).toBe('room-1');
    for (const privateRoom of privates) {
      expect(privateRoom.width).toBeGreaterThanOrEqual(3);
      expect(privateRoom.height).toBeGreaterThanOrEqual(3);
      expect(sharesWall(layout, hall.id, privateRoom.id)).toBe(true);
    }
    const entrance = layout.openings.find((opening) => opening.id === 'entrance');
    expect(entrance?.kind).toBe('door');
    expect(entrance?.a).toBe(hall.id);
    expect(entrance?.b).toBeNull();
    expect(layout.openings.every((opening) => opening.kind === 'door')).toBe(true);
    expect(roomsConnected(layout.rooms, layout.openings)).toBe(true);
    expect(layoutIssues(layout)).toEqual([]);

    const target = interiorTileTarget(2000);
    expect(Math.abs(result.interiorTiles - target)).toBeLessThanOrEqual(areaTolerance(4, target));
    expect(
      generateAdjacencyLayout(
        { areaSquareFeet: 2000, roomCount: 4, buildingType: 'residential' },
        'house',
      ),
    ).toEqual(result);
  });

  it('keeps commercial support rooms on a sales floor and the entrance on that floor', () => {
    const result = generateAdjacencyLayout(
      { areaSquareFeet: 2000, roomCount: 3, buildingType: 'commercial' },
      'shop',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const { layout } = result;
    const sales = room(layout, 'sales');
    const supports = layout.rooms.filter((candidate) => candidate.role === 'support');
    const salesArea = sales.width * sales.height;
    expect(supports).toHaveLength(2);
    expect(layout.width).toBeGreaterThan(layout.height);
    for (const support of supports) {
      expect(sharesWall(layout, sales.id, support.id)).toBe(true);
      expect(salesArea).toBeGreaterThanOrEqual(support.width * support.height);
    }
    expect(salesArea * 2).toBeGreaterThanOrEqual(result.interiorTiles);
    const entrance = layout.openings.find((opening) => opening.id === 'entrance');
    expect(entrance?.kind).toBe('passage');
    expect(entrance?.a).toBe(sales.id);
    expect(entrance?.b).toBeNull();
    expect(layout.openings.every((opening) => opening.kind === 'passage')).toBe(true);
    expect(roomsConnected(layout.rooms, layout.openings)).toBe(true);
    expect(layoutIssues(layout)).toEqual([]);
  });

  it('moves a door when the seed changes', () => {
    const cells = new Set<string>();
    for (let index = 0; index < 8; index++) {
      const result = generateAdjacencyLayout(
        { areaSquareFeet: 2000, roomCount: 4, buildingType: 'residential' },
        `door-${index}`,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      const entrance = result.layout.openings.find((opening) => opening.id === 'entrance');
      const cell = entrance?.cells[0];
      if (cell) {
        cells.add(`${cell.x},${cell.y}`);
      }
    }
    expect(cells.size).toBeGreaterThan(1);
  });
});
