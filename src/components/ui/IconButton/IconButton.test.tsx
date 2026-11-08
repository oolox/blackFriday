import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders with an accessible label', () => {
    render(<IconButton icon="close" label="Clear field" />);
    expect(screen.getByRole('button', { name: 'Clear field' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon="close" label="Clear field" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Clear field' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies a different class for secondary variant', () => {
    const { rerender } = render(<IconButton icon="close" label="Clear" variant="primary" />);
    const primaryClass = screen.getByRole('button', { name: 'Clear' }).className;

    rerender(<IconButton icon="close" label="Clear" variant="secondary" />);
    const secondaryClass = screen.getByRole('button', { name: 'Clear' }).className;

    expect(primaryClass).not.toBe(secondaryClass);
  });

  it('supports xs size', () => {
    render(<IconButton icon="lock" label="Lock seed" size="xs" />);
    expect(screen.getByRole('button', { name: 'Lock seed' }).className).toMatch(/xs/);
  });

  it('supports md size', () => {
    render(<IconButton icon="regenerate" label="Regenerate" size="md" />);
    expect(screen.getByRole('button', { name: 'Regenerate' }).className).toMatch(/md/);
  });

  it('applies success variant', () => {
    render(<IconButton icon="generate" label="Generate" variant="success" />);
    expect(screen.getByRole('button', { name: 'Generate' }).className).toMatch(/success/);
  });

  it('marks current buttons as pressed', () => {
    render(<IconButton icon="lock" label="Unlock seed" current />);
    expect(screen.getByRole('button', { name: 'Unlock seed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
