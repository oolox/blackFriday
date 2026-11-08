import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ButtonToggle, type ButtonToggleValue } from './ButtonToggle';

function ControlledToggle() {
  const [value, setValue] = useState<ButtonToggleValue>(0);
  return (
    <ButtonToggle
      icons={['ratio-square', 'ratio-16x9', 'ratio-9x16']}
      labels={['Square ratio', 'Wide ratio', 'Portrait ratio']}
      value={value}
      onChange={setValue}
    />
  );
}

describe('ButtonToggle', () => {
  it('shows the active icon label and advances value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ButtonToggle
        icons={['ratio-square', 'ratio-16x9', 'ratio-9x16']}
        labels={['Square ratio', 'Wide ratio', 'Portrait ratio']}
        value={0}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'Square ratio' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Square ratio' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('cycles through all states when controlled', async () => {
    const user = userEvent.setup();
    render(<ControlledToggle />);

    await user.click(screen.getByRole('button', { name: 'Square ratio' }));
    expect(screen.getByRole('button', { name: 'Wide ratio' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Wide ratio' }));
    expect(screen.getByRole('button', { name: 'Portrait ratio' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Portrait ratio' }));
    expect(screen.getByRole('button', { name: 'Square ratio' })).toBeInTheDocument();
  });
});
