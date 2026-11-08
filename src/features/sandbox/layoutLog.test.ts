import { describe, expect, it } from 'vitest';
import { splitLogBlocks } from './layoutLog';

describe('splitLogBlocks', () => {
  it('folds a closed fence and leaves an open one', () => {
    expect(splitLogBlocks('Hello\n```json\n{"a":1}\n```\nDone')).toEqual([
      { type: 'text', text: 'Hello' },
      { type: 'fence', lang: 'json', code: '{"a":1}', closed: true },
      { type: 'text', text: 'Done' },
    ]);
    expect(splitLogBlocks('```\npartial')).toEqual([
      { type: 'fence', lang: '', code: 'partial', closed: false },
    ]);
  });
});
