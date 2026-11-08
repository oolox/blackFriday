import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders an inline svg for a known icon name', () => {
    const { container } = render(<Icon name="send" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('supports an accessible label', () => {
    render(<Icon name="settings" label="Settings" />);
    expect(screen.getByRole('img', { name: 'Settings' })).toBeInTheDocument();
  });

  it('renders skip-to-start and skip-to-end icons', () => {
    const { container } = render(
      <>
        <Icon name="skip-to-start" />
        <Icon name="skip-to-end" />
      </>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
});
