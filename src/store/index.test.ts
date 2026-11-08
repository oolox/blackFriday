import { describe, it, expect } from 'vitest';
import { store } from './index';

describe('store', () => {
  it('starts on the play view', () => {
    expect(store.getState().appShell.activeView).toBe('play');
  });
});
