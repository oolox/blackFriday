import { describe, expect, it } from 'vitest';
import {
  TILE_PX,
  canPan,
  centerCamera,
  clampCamera,
  panCamera,
  visibleTiles,
  worldToScreen,
} from './camera';
import { roomOverlayText } from './roomOverlay';

describe('camera', () => {
  it('centers the building and keeps a fitting map centered', () => {
    expect(centerCamera(16, 18)).toEqual({ x: 8, y: 9 });
    const centered = clampCamera({ x: 0, y: 0 }, 4, 4, { widthPx: 400, heightPx: 400 }, TILE_PX);
    expect(centered).toEqual({ x: 2, y: 2 });
    expect(canPan(4, 400, TILE_PX)).toBe(false);
  });

  it('clamps a larger map to the box edges', () => {
    const view = { widthPx: 100, heightPx: 100 };
    expect(canPan(10, 100, TILE_PX)).toBe(true);
    expect(clampCamera({ x: 0, y: 100 }, 10, 10, view, TILE_PX)).toEqual({ x: 1, y: 9 });
    const origin = worldToScreen(0, 0, { x: 1, y: 1 }, view, TILE_PX);
    expect(origin).toEqual({ x: 0, y: 0 });
  });

  it('pans opposite the pointer and only draws the visible window', () => {
    expect(panCamera({ x: 5, y: 5 }, 50, -25, TILE_PX)).toEqual({ x: 4, y: 5.5 });
    expect(
      visibleTiles({ x: 5, y: 5 }, 10, 10, { widthPx: 100, heightPx: 100 }, TILE_PX, 1),
    ).toEqual({ x0: 3, y0: 3, x1: 7, y1: 7 });
    expect(
      visibleTiles({ x: 1, y: 1 }, 10, 10, { widthPx: 100, heightPx: 100 }, TILE_PX, 1).x0,
    ).toBe(0);
  });

  it('labels a room with its type and id', () => {
    expect(roomOverlayText({ id: 'room-1', role: 'hall', x: 1, y: 1, width: 3, height: 3 })).toBe(
      'Hall\nroom-1',
    );
  });
});
