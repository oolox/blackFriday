import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RotatableButtonBar } from './RotatableButtonBar';

describe('RotatableButtonBar', () => {
  it('renders children in a centered toolbar pill', () => {
    render(
      <RotatableButtonBar>
        <button type="button">Remove tile</button>
      </RotatableButtonBar>,
    );

    const bar = screen.getByRole('toolbar', { name: 'Tile actions' });
    expect(bar).toContainElement(screen.getByRole('button', { name: 'Remove tile' }));
    expect(bar.style.transform).toContain('translate(-50%, -50%)');
    expect(bar.style.transform).toContain('rotate(0deg)');
    expect(bar.style.transform).toContain('scale(1)');
  });

  it('stays screen-aligned against host zoom and rotation', () => {
    render(
      <RotatableButtonBar zoom={0.5} rotation={45}>
        <button type="button">Remove tile</button>
      </RotatableButtonBar>,
    );

    const bar = screen.getByRole('toolbar', { name: 'Tile actions' });
    expect(bar.style.transform).toContain('rotate(-45deg)');
    expect(bar.style.transform).toContain('scale(2)');
  });
});
