import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('uses type="button" by default', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);

    await user.click(screen.getByRole('button', { name: 'Go' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies a different class for secondary variant', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    const primaryClass = screen.getByRole('button', { name: 'Primary' }).className;

    rerender(<Button variant="secondary">Secondary</Button>);
    const secondaryClass = screen.getByRole('button', { name: 'Secondary' }).className;

    expect(primaryClass).not.toBe(secondaryClass);
  });

  it('forwards extra props such as disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('renders an optional trailing icon without changing the accessible name', () => {
    const { container } = render(<Button icon="caret-up">Name</Button>);
    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
