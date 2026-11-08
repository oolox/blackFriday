import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeedGenerator } from './SeedGenerator';

describe('SeedGenerator', () => {
  it('toggles open to reveal refresh; lock is always visible', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onLockedChange = vi.fn();
    const createSeed = vi.fn(() => 99);

    render(
      <SeedGenerator
        value={42}
        createSeed={createSeed}
        onChange={onChange}
        onLockedChange={onLockedChange}
      />,
    );

    const seedInput = screen.getByRole('textbox', { name: 'Seed' });
    expect(seedInput).toHaveValue('42');
    expect(seedInput).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Refresh seed' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock seed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock seed' })).not.toHaveAttribute(
      'aria-pressed',
    );

    const toggle = screen.getByRole('button', { name: 'Seed options' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(seedInput).toBeEnabled();
    expect(seedInput).toHaveValue('42');
    expect(screen.getByRole('button', { name: 'Refresh seed' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Refresh seed' }));
    expect(createSeed).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(99);

    await user.click(screen.getByRole('button', { name: 'Lock seed' }));
    expect(onLockedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Unlock seed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Unlock seed' }));
    expect(onLockedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: 'Lock seed' })).not.toHaveAttribute(
      'aria-pressed',
    );
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Refresh seed' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock seed' })).toBeInTheDocument();
  });

  it('shows only the last 4 digits when closed', () => {
    render(
      <SeedGenerator value={1234567890} createSeed={() => 1} onChange={() => {}} />,
    );

    expect(screen.getByRole('textbox', { name: 'Seed' })).toHaveValue('7890');
  });

  it('updates seed when the user submits the open text input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SeedGenerator value={42} createSeed={() => 1} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Seed options' }));
    const seedInput = screen.getByRole('textbox', { name: 'Seed' });
    await user.clear(seedInput);
    await user.type(seedInput, '123{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(123);
  });
});
