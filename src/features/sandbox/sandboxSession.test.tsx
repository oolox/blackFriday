import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import { generateLlmMap } from '../../services/mapGeneration/generateLlmMap';
import { SandboxSessionProvider } from './sandboxSession';

vi.mock('../../services/mapGeneration/generateLlmMap', () => ({
  generateLlmMap: vi.fn(
    async (request: {
      brief: string;
      onTrace?: (delta: { kind: string; text: string }) => void;
    }) => {
      request.onTrace?.({ kind: 'reasoning', text: 'hall along the west wall' });
      return {
        ok: true as const,
        map: {
          parameters: { areaSquareFeet: 861, roomCount: 1, buildingType: 'residential' as const },
          seed: 'sandbox-1',
          generatorId: 'llm-v1',
          brief: request.brief,
          interiorTiles: 80,
          layout: { width: 3, height: 3, rooms: [], walls: [], openings: [] },
          palette: [''],
          cells: new Uint16Array(9),
        },
      };
    },
  ),
}));

describe('SandboxSessionProvider', () => {
  it('keeps the dialog open after an LLM layout so the log can be copied', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SandboxSessionProvider>
        <div />
      </SandboxSessionProvider>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Brief' }), 'a small house');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.getByRole('dialog', { name: 'Generate New Map' })).toBeInTheDocument();
    expect(screen.getByText('hall along the west wall')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(generateLlmMap).toHaveBeenCalledWith(
      expect.objectContaining({ brief: 'a small house', reasoning: 'off' }),
    );
  });
});
