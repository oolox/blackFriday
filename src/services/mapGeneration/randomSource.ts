/** Seeded randomness. Generators take this instead of calling `Math.random`. */
export interface RandomSource {
  /** A float in `[0, 1)`. */
  next(): number;
  /** An integer in `[min, max]`. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSource(seed: string): RandomSource {
  const next = mulberry32(hashSeed(seed));
  return {
    next,
    int(min: number, max: number): number {
      const span = max - min + 1;
      return min + Math.floor(next() * span);
    },
    pick<T>(items: readonly T[]): T {
      const choice = items[this.int(0, items.length - 1)];
      if (choice === undefined) {
        throw new Error('cannot pick from an empty list');
      }
      return choice;
    },
  };
}
