import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders an accessible loading graphic', () => {
    render(<Spinner label="Creating character" />);
    expect(screen.getByRole('img', { name: 'Creating character' })).toBeInTheDocument();
  });

  it('defaults to 96px width with a compact height', () => {
    render(<Spinner />);
    const svg = screen.getByRole('img', { name: 'Loading' });
    expect(svg).toHaveAttribute('width', '96');
    expect(svg).toHaveAttribute('height', '20');
  });
});
