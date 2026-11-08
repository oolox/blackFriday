import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FullScreenModal } from './FullScreenModal';

describe('FullScreenModal', () => {
  it('renders nothing when closed', () => {
    render(
      <FullScreenModal open={false} onClose={vi.fn()}>
        Hidden
      </FullScreenModal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    render(
      <FullScreenModal open onClose={vi.fn()}>
        Placeholder
      </FullScreenModal>,
    );
    expect(screen.getByRole('dialog', { name: 'Modal' })).toBeInTheDocument();
    expect(screen.getByText('Placeholder')).toBeInTheDocument();
  });

  it('closes from the top-right button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <FullScreenModal open onClose={onClose}>
        Placeholder
      </FullScreenModal>,
    );

    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when it cannot be dismissed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <FullScreenModal open dismissible={false} onClose={onClose}>
        Required
      </FullScreenModal>,
    );

    expect(screen.queryByRole('button', { name: 'Close modal' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog', { name: 'Modal' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <FullScreenModal open onClose={onClose}>
        Placeholder
      </FullScreenModal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
