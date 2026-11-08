import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerateMapDialog } from './GenerateMapDialog';
import { DEFAULT_MAP_PARAMETERS } from './sandboxSessionContext';
import { renderWithProviders } from '../../test/test-utils';

describe('GenerateMapDialog', () => {
  it('logs thinking and folds a fenced reply', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GenerateMapDialog
        open
        canCancel
        planner="llm"
        parameters={DEFAULT_MAP_PARAMETERS}
        onCancel={() => undefined}
        onGenerate={(_request, onTrace) => {
          onTrace?.({ kind: 'reasoning', text: 'Place the hall first.' });
          onTrace?.({
            kind: 'content',
            text: 'Here.\n```json\n{"tool":"layout"}\n```\n',
          });
          return 'bad fence';
        }}
      />,
    );

    expect(screen.getByLabelText('Model log')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Square footage' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Brief' }), 'a small house');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.getByText('Place the hall first.')).toBeInTheDocument();
    expect(screen.getByText('Reply')).toBeInTheDocument();
    expect(screen.getByText('json').closest('details')).not.toHaveAttribute('open');
  });
});
