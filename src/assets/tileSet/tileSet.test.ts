import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tiles } from './tileSet';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('tiles', () => {
  it('keeps every legacy struct, product, and trigger', () => {
    expect(tiles.filter((tile) => tile.type === 'struct')).toHaveLength(10);
    expect(tiles.filter((tile) => tile.type === 'product')).toHaveLength(22);
    expect(tiles.filter((tile) => tile.type === 'trigger')).toHaveLength(7);
  });

  it('gives every tile a unique id and a sprite that exists', () => {
    const ids = tiles.map((tile) => tile.id);
    const names = tiles.map((tile) => tile.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);

    for (const tile of tiles) {
      expect(tile.id).toMatch(UUID);
      expect(tile.file.startsWith('assets/sprites/')).toBe(true);
      expect(existsSync(resolve('src', tile.file))).toBe(true);
      const actAs = tile.actAs;
      expect(actAs).toBeDefined();
      if (!actAs) continue;

      switch (actAs.action) {
        case 'wall':
        case 'shelf':
          expect(actAs.speed).toBe(0);
          break;
        case 'floor':
        case 'door':
          expect(actAs.speed).toBeGreaterThan(0);
          expect(actAs.speed).toBeLessThanOrEqual(1);
          break;
        case 'slow':
          expect(actAs.speed).toBeGreaterThan(0);
          break;
        case 'characterSpeed':
          expect(actAs.speed).toBeGreaterThan(0);
          expect(actAs.duration).toBeGreaterThan(0);
          break;
        case 'sale':
          expect(actAs.cost).toBeGreaterThan(0);
          expect(actAs.duration).toBeGreaterThan(0);
          break;
        case 'purchase':
          expect(actAs.cost).toBeGreaterThan(0);
          break;
        case 'slide':
        case 'register':
          break;
      }
    }
  });
});
