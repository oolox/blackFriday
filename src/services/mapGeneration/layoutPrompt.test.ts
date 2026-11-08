import { describe, expect, it } from 'vitest';
import { layoutSetupPrompt, layoutSystemPrompt } from './layoutPrompt';

describe('layout prompts', () => {
  it('lets the model choose the size and sends only the brief', () => {
    const brief = 'Make me a posh mansion with 8 bedrooms, 2 baths and a study.';
    const setup = layoutSetupPrompt('sandbox-1', brief);
    expect(layoutSystemPrompt).toContain('one json code fence');
    expect(layoutSystemPrompt).toContain('"areaSquareFeet": 861');
    expect(layoutSystemPrompt).toContain('"roomCount": 2');
    expect(layoutSystemPrompt).toContain('You choose the size');
    expect(setup).toContain(brief);
    expect(setup).toContain('Seed: sandbox-1');
    expect(setup).not.toContain('areaSquareFeet');
    expect(setup).not.toContain('interiorTiles');
    expect(setup).not.toContain('tolerance');
  });
});
