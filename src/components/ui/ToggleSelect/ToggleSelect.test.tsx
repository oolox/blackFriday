import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleSelect } from './ToggleSelect';

const items = [
  { id: 'a', label: 'fla', ariaLabel: 'Flash' },
  { id: 'b', label: 'pro', ariaLabel: 'Pro' },
];

describe('ToggleSelect', () => {
  it('shows the active option when collapsed and expands on toggle', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ToggleSelect
        label="Model"
        items={items}
        value="a"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'Flash' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pro' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Model' }));
    expect(screen.getByRole('button', { name: 'Pro' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pro' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
