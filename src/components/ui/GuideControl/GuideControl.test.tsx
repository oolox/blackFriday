import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuideControl } from './GuideControl';

describe('GuideControl', () => {
  it('toggles open to edit guidance and submits on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<GuideControl value={7.5} onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Guidance' });
    expect(input).toHaveValue('7.5');
    expect(input).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Guidance options' }));
    expect(input).toBeEnabled();

    await user.clear(input);
    await user.type(input, '12{Enter}');
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it('increments and decrements by 0.1 when open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(<GuideControl value={7.5} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Guidance options' }));
    await user.click(screen.getByRole('button', { name: 'Increase Guidance' }));
    expect(onChange).toHaveBeenCalledWith(7.6);

    rerender(<GuideControl value={7.6} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Decrease Guidance' }));
    expect(onChange).toHaveBeenCalledWith(7.5);
  });

  it('resets to the model default when reset is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<GuideControl value={12} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Guidance options' }));
    await user.click(screen.getByRole('button', { name: 'Reset Guidance' }));
    expect(onChange).toHaveBeenCalledWith(7.5);
  });
});
