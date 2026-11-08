import { describe, expect, it } from 'vitest';
import { tiles } from '../../assets/tileSet/tileSet';
import { cellAt, roomRects } from '../../types/map';
import { acceptLayoutFence } from './acceptLayoutFence';

function fence(
  data: { rooms: unknown[] } & Record<string, unknown>,
  areaSquareFeet: number,
): string {
  return `Here is the plan.\n\`\`\`json\n${JSON.stringify({
    tool: 'layout',
    origin: 'agent',
    action: 'create',
    id: 'seed',
    data: { ...data, areaSquareFeet, roomCount: data.rooms.length },
  })}\n\`\`\``;
}

function accept(text: string) {
  return acceptLayoutFence({
    text,
    seed: 'seed',
    tiles,
    brief: 'brief',
  });
}

describe('acceptLayoutFence', () => {
  it('stamps the example rectangle', () => {
    const result = accept(
      fence(
        {
          width: 12,
          height: 11,
          buildingType: 'residential',
          outside: [],
          rooms: [
            { id: 'room-1', role: 'hall', rects: [{ x: 1, y: 7, width: 10, height: 3 }] },
            { id: 'room-2', role: 'living', rects: [{ x: 1, y: 1, width: 10, height: 5 }] },
          ],
        },
        861,
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.map.generatorId).toBe('llm-v1');
    expect(result.map.brief).toBe('brief');
    expect(result.map.parameters).toEqual({
      areaSquareFeet: 861,
      roomCount: 2,
      buildingType: 'residential',
    });
    expect(result.map.rawFence).toContain('"tool":"layout"');
    const again = accept(result.map.rawFence ?? '');
    expect(again.ok).toBe(true);
  });

  it('keeps an L as one room', () => {
    const result = accept(
      fence(
        {
          width: 10,
          height: 9,
          buildingType: 'residential',
          outside: [],
          rooms: [
            {
              id: 'room-1',
              role: 'hall',
              rects: [
                { x: 1, y: 1, width: 3, height: 7 },
                { x: 4, y: 5, width: 5, height: 3 },
              ],
            },
            { id: 'room-2', role: 'living', rects: [{ x: 5, y: 1, width: 4, height: 3 }] },
          ],
        },
        517,
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const hall = result.map.layout.rooms.find((room) => room.role === 'hall');
    expect(roomRects(hall ?? { id: '', x: 0, y: 0, width: 0, height: 0 }).length).toBe(2);
  });

  it('lets a bath sit off the shell', () => {
    const result = accept(
      fence(
        {
          width: 13,
          height: 13,
          buildingType: 'residential',
          outside: [],
          rooms: [
            { id: 'room-1', role: 'hall', rects: [{ x: 1, y: 1, width: 3, height: 11 }] },
            { id: 'room-2', role: 'living', rects: [{ x: 5, y: 1, width: 7, height: 3 }] },
            { id: 'room-3', role: 'bath', rects: [{ x: 5, y: 5, width: 3, height: 3 }] },
            { id: 'room-4', role: 'bedroom', rects: [{ x: 9, y: 5, width: 3, height: 3 }] },
            { id: 'room-5', role: 'kitchen', rects: [{ x: 5, y: 9, width: 7, height: 3 }] },
          ],
        },
        1001,
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const bath = result.map.layout.rooms.find((room) => room.role === 'bath');
    expect(bath).toBeDefined();
    if (!bath) {
      return;
    }
    expect(bath.x).toBeGreaterThan(1);
    expect(bath.y).toBeGreaterThan(1);
    expect(bath.x + bath.width).toBeLessThan(result.map.layout.width - 1);
    expect(bath.y + bath.height).toBeLessThan(result.map.layout.height - 1);
  });

  it('leaves an atrium empty', () => {
    const outside = [];
    for (let y = 5; y <= 7; y++) {
      for (let x = 5; x <= 7; x++) {
        outside.push({ x, y });
      }
    }
    const result = accept(
      fence(
        {
          width: 13,
          height: 13,
          buildingType: 'residential',
          outside,
          rooms: [
            {
              id: 'room-1',
              role: 'living',
              rects: [
                { x: 1, y: 1, width: 11, height: 3 },
                { x: 1, y: 9, width: 11, height: 3 },
                { x: 1, y: 4, width: 3, height: 5 },
                { x: 9, y: 4, width: 3, height: 5 },
              ],
            },
          ],
        },
        1033,
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.map.layout.rooms[0]?.parts?.length).toBe(3);
    expect(cellAt(13, 13, result.map.cells, 6, 6)).toBe(0);
  });

  it('keeps a mansion room list and a mini-mall room list', () => {
    const mansion = accept(
      fence(
        {
          width: 10,
          height: 21,
          buildingType: 'residential',
          outside: [],
          rooms: [
            { id: 'room-1', role: 'hall', rects: [{ x: 1, y: 1, width: 3, height: 19 }] },
            { id: 'room-2', role: 'living', rects: [{ x: 5, y: 1, width: 4, height: 3 }] },
            { id: 'room-3', role: 'kitchen', rects: [{ x: 5, y: 5, width: 4, height: 3 }] },
            { id: 'room-4', role: 'bedroom', rects: [{ x: 5, y: 9, width: 4, height: 3 }] },
            { id: 'room-5', role: 'bath', rects: [{ x: 5, y: 13, width: 4, height: 3 }] },
            { id: 'room-6', role: 'study', rects: [{ x: 5, y: 17, width: 4, height: 3 }] },
          ],
        },
        1259,
      ),
    );
    const mall = accept(
      fence(
        {
          width: 18,
          height: 11,
          buildingType: 'commercial',
          outside: [],
          rooms: [
            { id: 'room-1', role: 'concourse', rects: [{ x: 1, y: 7, width: 16, height: 3 }] },
            { id: 'room-2', role: 'showroom', rects: [{ x: 1, y: 1, width: 3, height: 5 }] },
            { id: 'room-3', role: 'dining', rects: [{ x: 5, y: 1, width: 3, height: 5 }] },
            { id: 'room-4', role: 'staff', rects: [{ x: 9, y: 1, width: 3, height: 5 }] },
            { id: 'room-5', role: 'restroom', rects: [{ x: 13, y: 1, width: 4, height: 5 }] },
          ],
        },
        1216,
      ),
    );
    expect(mansion.ok && mall.ok).toBe(true);
    if (!mansion.ok || !mall.ok) {
      return;
    }
    expect(mansion.map.layout.rooms.map((room) => room.role).sort()).toEqual([
      'bath',
      'bedroom',
      'hall',
      'kitchen',
      'living',
      'study',
    ]);
    expect(mall.map.parameters.buildingType).toBe('commercial');
    expect(mall.map.layout.rooms.map((room) => room.role).sort()).toEqual([
      'concourse',
      'dining',
      'restroom',
      'showroom',
      'staff',
    ]);
    expect(mall.map.layout.openings.every((opening) => opening.kind === 'passage')).toBe(true);
  });

  it('keeps a floor that misses the claimed square footage', () => {
    const outside = [];
    for (let y = 5; y <= 7; y++) {
      for (let x = 5; x <= 7; x++) {
        outside.push({ x, y });
      }
    }
    const result = accept(
      fence(
        {
          width: 13,
          height: 13,
          buildingType: 'residential',
          outside,
          rooms: [
            {
              id: 'room-1',
              role: 'living',
              rects: [
                { x: 1, y: 1, width: 11, height: 3 },
                { x: 1, y: 9, width: 11, height: 3 },
                { x: 1, y: 4, width: 3, height: 5 },
                { x: 9, y: 4, width: 3, height: 5 },
              ],
            },
          ],
        },
        1292,
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.map.interiorTiles).toBe(96);
    expect(result.map.parameters.areaSquareFeet).toBe(1033);
    expect(result.map.parameters.roomCount).toBe(1);
  });

  it('rejects prose, the wrong tool, and a bad fence', () => {
    expect(accept('I would put the hall on the south.').ok).toBe(false);
    expect(
      accept(
        '```json\n{"tool":"other","origin":"agent","action":"create","id":"seed","data":{}}\n```',
      ).ok,
    ).toBe(false);
    expect(accept('```json\n{not json}\n```').ok).toBe(false);
    expect(accept('   ').ok).toBe(false);
  });
});
