import { describe, expect, it } from 'vitest';
import { layoutSetupPrompt, layoutSystemPrompt } from './layoutPrompt';

describe('layout prompts', () => {
  it('lets the model choose the size and sends only the brief', () => {
    const brief = 'Make me a posh mansion with 8 bedrooms, 2 baths and a study.';
    const setup = layoutSetupPrompt('sandbox-1', brief);
    expect(layoutSystemPrompt).toContain('one json fence');
    expect(layoutSystemPrompt).toContain('1. Program.');
    expect(layoutSystemPrompt).toContain('2. Circulation.');
    expect(layoutSystemPrompt).toContain('3. Layout.');
    expect(layoutSystemPrompt).toContain('shell touches the outermost floor');
    expect(layoutSystemPrompt).toContain('Omit square footage');
    expect(layoutSystemPrompt).not.toContain('areaSquareFeet');
    expect(layoutSystemPrompt).not.toContain('Think through');
    expect(setup).toContain(brief);
    expect(setup).toContain('Seed: sandbox-1');
    expect(setup).not.toContain('areaSquareFeet');
    expect(setup).not.toContain('interiorTiles');
    expect(setup).not.toContain('tolerance');
  });
});
