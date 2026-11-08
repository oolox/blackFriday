import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepsControl } from './StepsControl';

describe('StepsControl', () => {
  it('toggles open to edit steps and submits on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StepsControl value={40} onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Steps' });
    expect(input).toHaveValue('40');
    expect(input).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Steps options' }));
    expect(input).toBeEnabled();

    await user.clear(input);
    await user.type(input, '28{Enter}');
    expect(onChange).toHaveBeenCalledWith(28);
  });

  it('increments and decrements by 1 when open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(<StepsControl value={40} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Steps options' }));
    await user.click(screen.getByRole('button', { name: 'Increase Steps' }));
    expect(onChange).toHaveBeenCalledWith(41);

    rerender(<StepsControl value={41} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Decrease Steps' }));
    expect(onChange).toHaveBeenCalledWith(40);
  });

  it('resets to the model default when reset is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StepsControl value={28} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Steps options' }));
    await user.click(screen.getByRole('button', { name: 'Reset Steps' }));
    expect(onChange).toHaveBeenCalledWith(20);
  });
});
