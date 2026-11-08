import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
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
        onGenerate={(request, onTrace) => {
          expect(request).toEqual({ kind: 'llm', brief: 'a small house', reasoning: 'low' });
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
    expect(screen.getByRole('combobox', { name: 'Reasoning' })).toHaveValue('off');
    await user.type(screen.getByRole('textbox', { name: 'Brief' }), 'a small house');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Reasoning' }), 'low');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.getByText('Place the hall first.')).toBeInTheDocument();
    expect(screen.getByText('Reply')).toBeInTheDocument();
    expect(screen.getByText('json').closest('details')).not.toHaveAttribute('open');
  });

  it('closes only from the Close button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(
      <GenerateMapDialog
        open
        canCancel
        planner="llm"
        parameters={DEFAULT_MAP_PARAMETERS}
        onCancel={onCancel}
        onGenerate={() => null}
      />,
    );

    fireEvent.click(screen.getByRole('dialog', { name: 'Generate New Map' }));
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Close modal' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
