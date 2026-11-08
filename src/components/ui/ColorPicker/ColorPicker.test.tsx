import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('opens a token-styled panel from calvasPicker and reports hex changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker color="#f97316" onChange={onChange} />);

    expect(screen.queryByRole('dialog', { name: 'Color picker' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'calvasPicker' }));
    expect(screen.getByRole('dialog', { name: 'Color picker' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'calvasPicker' }).className).toMatch(/xs/);
    expect(screen.getByRole('button', { name: 'calvasPicker' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    const hex = screen.getByLabelText('Hex color');
    await user.clear(hex);
    await user.type(hex, '0895f7');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0].toLowerCase()).toContain('0895f7');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<ColorPicker />);

    await user.click(screen.getByRole('button', { name: 'calvasPicker' }));
    expect(screen.getByRole('dialog', { name: 'Color picker' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Color picker' })).not.toBeInTheDocument();
  });
});
