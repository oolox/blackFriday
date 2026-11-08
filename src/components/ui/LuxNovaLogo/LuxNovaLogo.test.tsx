import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LuxNovaLogo } from './LuxNovaLogo';

describe('LuxNovaLogo', () => {
  it('renders an accessible animated logo', () => {
    render(<LuxNovaLogo />);

    const logo = screen.getByRole('img', { name: 'LuxNova' });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('width', '78.65');
    expect(logo).toHaveAttribute('height', '15.65');
    expect(logo).toHaveAttribute('viewBox', '45.175 17.175 78.65 15.65');
  });
});
