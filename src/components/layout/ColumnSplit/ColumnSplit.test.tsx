import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ColumnSplit } from './ColumnSplit';

describe('ColumnSplit', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          width: 1000,
          height: 600,
          top: 0,
          left: 0,
          bottom: 600,
          right: 1000,
          x: 0,
          y: 0,
          toJSON() {
            return {};
          },
        }) as DOMRect,
    );
  });

  it('widens the left pane when the divider is dragged right', () => {
    render(
      <ColumnSplit
        aria-label="Resize game and assets"
        storageKey="blackfriday.testSplit"
        defaultWidthPx={500}
        defaultRatio={0.5}
        minWidthPx={200}
        left={<div>Left pane</div>}
        right={<div>Right pane</div>}
      />,
    );

    const handle = screen.getByRole('separator', { name: 'Resize game and assets' });
    expect(handle).toHaveAttribute('aria-valuenow', '500');

    fireEvent.pointerDown(handle, { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 640, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 640, pointerId: 1 });

    expect(handle).toHaveAttribute('aria-valuenow', '640');
  });
});
