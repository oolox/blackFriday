import { describe, expect, it } from 'vitest';
import { tiles } from '../../assets/tileSet/tileSet';
import { cellAt, layoutIssues, roomRects } from '../../types/map';
import { areaTolerance, interiorTileTarget } from './generateBspLayout';
import { generateMap } from './generateMap';
import { generateProgramLayout } from './generateProgramLayout';
import { roomsConnected } from './planOpenings';

const house = {
  areaSquareFeet: 2000,
  roomCount: 4,
  buildingType: 'residential' as const,
};

function floorArea(layout: {
  rooms: {
    x: number;
    y: number;
    width: number;
    height: number;
    parts?: { width: number; height: number }[];
  }[];
}): number {
  return layout.rooms.reduce(
    (sum, room) =>
      sum + roomRects(room).reduce((partSum, part) => partSum + part.width * part.height, 0),
    0,
  );
}

describe('generateProgramLayout', () => {
  it('places a 4-room house without a full-width front room', () => {
    const result = generateProgramLayout(house, 'house');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const { layout } = result;
    expect(layoutIssues(layout)).toEqual([]);
    expect(roomsConnected(layout.rooms, layout.openings)).toBe(true);
    const target = interiorTileTarget(2000);
    expect(Math.abs(floorArea(layout) - target)).toBeLessThanOrEqual(areaTolerance(4, target));
    const hall = layout.rooms.find((room) => room.role === 'hall');
    const living = layout.rooms.find((room) => room.role === 'living');
    const bath = layout.rooms.find((room) => room.role === 'bath');
    expect(hall).toBeDefined();
    expect(living && hall && living.width < layout.width - 2).toBe(true);
    expect(hall && hall.width < layout.width - 2).toBe(true);
    expect(bath).toBeDefined();
    const areas = layout.rooms.map((room) =>
      roomRects(room).reduce((sum, part) => sum + part.width * part.height, 0),
    );
    expect(new Set(areas).size).toBeGreaterThan(1);
    const livingArea = areas[layout.rooms.findIndex((room) => room.role === 'living')] ?? 0;
    expect(livingArea).toBeGreaterThan(
      Math.max(...areas.filter((_, index) => layout.rooms[index]?.role !== 'living')),
    );
  });

  it('draws an L or an atrium for some seeds, and stamps the grid', () => {
    const outlines = new Set<string>();
    for (let index = 0; index < 12; index++) {
      const result = generateProgramLayout(house, `seed-${index}`);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      const outside = result.layout.outside ?? [];
      const court = outside.some(
        (cell) =>
          cell.x > 0 &&
          cell.y > 0 &&
          cell.x < result.layout.width - 1 &&
          cell.y < result.layout.height - 1,
      );
      const notch = outside.some(
        (cell) =>
          cell.x === 0 ||
          cell.y === 0 ||
          cell.x === result.layout.width - 1 ||
          cell.y === result.layout.height - 1,
      );
      outlines.add(court ? 'atrium' : notch ? 'l' : 'rectangle');
      const stamped = generateMap({ parameters: house, tiles, seed: `seed-${index}` });
      if (!stamped.ok) {
        expect(stamped.errors).toEqual([]);
      }
    }
    expect(outlines.size).toBeGreaterThan(1);
  });

  it('keeps a shop showroom larger than the other rooms', () => {
    const result = generateProgramLayout(
      { areaSquareFeet: 2000, roomCount: 4, buildingType: 'commercial' },
      'shop',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const sales = result.layout.rooms.find((room) => room.role === 'sales');
    expect(sales).toBeDefined();
    if (!sales) {
      return;
    }
    const salesArea = roomRects(sales).reduce((sum, part) => sum + part.width * part.height, 0);
    const target = interiorTileTarget(2000);
    expect(salesArea).toBeGreaterThanOrEqual(Math.ceil(target / 2));
    for (const room of result.layout.rooms) {
      if (room.role === 'sales') {
        continue;
      }
      const area = roomRects(room).reduce((sum, part) => sum + part.width * part.height, 0);
      expect(salesArea).toBeGreaterThan(area);
    }
    expect(
      result.layout.openings.some((opening) => opening.id === 'entrance' && opening.a === sales.id),
    ).toBe(true);
  });

  it('leaves the courtyard empty and closes the corner of an L', () => {
    const atrium = generateMap({ parameters: house, tiles, seed: 'seed-6' });
    const elbow = generateMap({ parameters: house, tiles, seed: 'seed-7' });
    expect(atrium.ok && elbow.ok).toBe(true);
    if (!atrium.ok || !elbow.ok) {
      return;
    }
    const court = atrium.map.layout.outside ?? [];
    expect(court.length).toBeGreaterThan(0);
    for (const cell of court) {
      if (!besideFloor(atrium.map.layout, cell.x, cell.y)) {
        expect(
          cellAt(
            atrium.map.layout.width,
            atrium.map.layout.height,
            atrium.map.cells,
            cell.x,
            cell.y,
          ),
        ).toBe(0);
      }
    }
    const notch = (elbow.map.layout.outside ?? []).filter((cell) =>
      besideFloor(elbow.map.layout, cell.x, cell.y),
    );
    const open = notch.filter(
      (cell) =>
        cellAt(elbow.map.layout.width, elbow.map.layout.height, elbow.map.cells, cell.x, cell.y) !==
        2,
    );
    expect(open).toEqual([]);
  });
});

function besideFloor(
  layout: { rooms: Parameters<typeof roomRects>[0][] },
  x: number,
  y: number,
): boolean {
  return layout.rooms.some((room) =>
    roomRects(room).some(
      (part) =>
        x >= part.x - 1 && x <= part.x + part.width && y >= part.y - 1 && y <= part.y + part.height,
    ),
  );
}
