import { beforeEach, describe, expect, it } from 'vitest';
import {
  clampColumnSplitWidth,
  hasStoredColumnSplitWidth,
  readColumnSplitWidth,
  writeColumnSplitWidth,
} from './columnSplitWidth';

const OPTIONS = {
  storageKey: 'blackfriday.testColumnWidthPx',
  defaultWidthPx: 300,
  minWidthPx: 200,
  edgeRatio: 0.1,
} as const;

describe('columnSplitWidth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clamps within edge ratios and min width', () => {
    expect(clampColumnSplitWidth(10, 1000, OPTIONS)).toBe(200);
    expect(clampColumnSplitWidth(9999, 1000, OPTIONS)).toBe(900);
    expect(clampColumnSplitWidth(400, 1000, OPTIONS)).toBe(400);
  });

  it('reads default until written', () => {
    expect(hasStoredColumnSplitWidth(OPTIONS.storageKey)).toBe(false);
    expect(readColumnSplitWidth(OPTIONS)).toBe(300);
    expect(writeColumnSplitWidth(450, 1200, OPTIONS)).toBe(450);
    expect(hasStoredColumnSplitWidth(OPTIONS.storageKey)).toBe(true);
    expect(readColumnSplitWidth(OPTIONS)).toBe(450);
  });
});
