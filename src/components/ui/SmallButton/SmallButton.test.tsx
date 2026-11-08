import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmallButton } from './SmallButton';

describe('SmallButton', () => {
  it('renders children', () => {
    render(<SmallButton>Sort</SmallButton>);
    expect(screen.getByRole('button', { name: 'Sort' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SmallButton onClick={onClick}>Go</SmallButton>);

    await user.click(screen.getByRole('button', { name: 'Go' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks current buttons as pressed', () => {
    render(<SmallButton current>Name</SmallButton>);
    expect(screen.getByRole('button', { name: 'Name' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders an optional trailing icon without changing the accessible name', () => {
    const { container } = render(<SmallButton icon="caret-down">Updated</SmallButton>);
    expect(screen.getByRole('button', { name: 'Updated' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
