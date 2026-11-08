import { describe, expect, it } from 'vitest';
import { cellAt, gridIssues, layoutIssues, type MapLayout, type Opening, type Room } from './map';

function room(id: string, x: number, y: number, width = 3, height = 3): Room {
  return { id, x, y, width, height };
}

function door(id: string, a: string | null, b: string | null, x: number, y: number): Opening {
  return { id, kind: 'door', a, b, cells: [{ x, y }] };
}

/** Two 3×3 rooms separated by a one-tile wall, plus an exterior door. */
function twoRoomLayout(): MapLayout {
  return {
    width: 9,
    height: 5,
    rooms: [room('a', 1, 1), room('b', 5, 1)],
    walls: [],
    openings: [door('between', 'a', 'b', 4, 2), door('entrance', 'a', null, 2, 0)],
  };
}

describe('layoutIssues', () => {
  it('accepts disjoint rooms and openings on wall cells', () => {
    expect(layoutIssues(twoRoomLayout())).toEqual([]);
  });

  it('rejects a bounding box outside 1 to 1024', () => {
    const layout = twoRoomLayout();
    layout.width = 1025;
    expect(layoutIssues(layout)).toContain('width must be an integer from 1 to 1024');
  });

  it('rejects overlapping rooms', () => {
    const layout = twoRoomLayout();
    layout.rooms[1] = room('b', 3, 1);
    expect(layoutIssues(layout)).toContain('room a overlaps b');
  });

  it('rejects an opening on an interior cell', () => {
    const layout = twoRoomLayout();
    layout.openings[0] = door('between', 'a', 'b', 2, 2);
    expect(layoutIssues(layout)).toContain('opening between cell (2,2) is not a wall');
  });

  it('rejects an opening that misses the room it names', () => {
    const layout = twoRoomLayout();
    layout.openings = [door('entrance', 'b', null, 2, 0)];
    expect(layoutIssues(layout)).toContain('opening entrance cell (2,0) does not touch room b');
  });
});

describe('gridIssues', () => {
  it('accepts a palette index grid', () => {
    const palette = ['', 'floor-1'];
    const cells = new Uint16Array([0, 1, 1, 0]);

    expect(gridIssues(2, 2, palette, cells)).toEqual([]);
    expect(cellAt(2, 2, cells, 1, 0)).toBe(1);
    expect(cellAt(2, 2, cells, 5, 5)).toBe(0);
  });

  it('rejects a short grid and an index past the palette', () => {
    const palette = ['', 'floor-1'];

    expect(gridIssues(2, 2, palette, new Uint16Array(3))).toContain('cells length must be 4');
    expect(gridIssues(2, 2, palette, new Uint16Array([0, 2, 0, 0]))).toContain(
      'cell 1 index 2 is outside the palette',
    );
  });
});
