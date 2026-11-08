import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { NotificationProvider } from '../../notification/Notification/NotificationProvider';
import { BottomDrawer } from './BottomDrawer';
import type { BottomDrawerItem } from './bottomDrawerItems';

function renderDrawer(ui: ReactElement) {
  return render(<NotificationProvider>{ui}</NotificationProvider>);
}

const items: BottomDrawerItem[] = [
  {
    key: 'start:img-1',
    imageId: 'img-1',
    role: 'start',
    thumbUrl: 'blob:start',
    label: 'Start frame',
  },
  {
    key: 'ref:img-2',
    imageId: 'img-2',
    role: 'ref',
    thumbUrl: 'blob:ref',
    aspect: '16:9',
    label: 'Reference image',
  },
  {
    key: 'staging:img-3',
    imageId: 'img-3',
    thumbUrl: 'blob:staging',
    label: 'Gallery image',
  },
];

describe('BottomDrawer', () => {
  it('renders nothing when there are no tagged items', () => {
    const { container } = renderDrawer(<BottomDrawer items={[]} onRemoveTag={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('opens empty when forced open for tagging drag', async () => {
    renderDrawer(<BottomDrawer items={[]} onRemoveTag={vi.fn()} open />);

    const region = screen.getByRole('region', { name: 'Tagged gallery assets' });
    await waitFor(() => {
      expect(region).toHaveClass(/expanded/);
    });
  });

  it('slides down when emptied after having items', async () => {
    const { rerender } = renderDrawer(
      <BottomDrawer items={items.slice(0, 1)} onRemoveTag={vi.fn()} />,
    );
    const region = screen.getByRole('region', { name: 'Tagged gallery assets' });
    await waitFor(() => {
      expect(region).toHaveClass(/expanded/);
    });

    rerender(
      <NotificationProvider>
        <BottomDrawer items={[]} onRemoveTag={vi.fn()} />
      </NotificationProvider>,
    );
    expect(region).not.toHaveClass(/expanded/);
    expect(region).toBeInTheDocument();
  });

  it('renders tagged thumbnails with role badges best-fit in 256×144', () => {
    renderDrawer(
      <BottomDrawer
        items={[
          items[0]!,
          { ...items[1]!, width: 1920, height: 1080 },
        ]}
        onRemoveTag={vi.fn()}
      />,
    );

    const start = screen.getByLabelText('Start frame');
    const ref = screen.getByLabelText('Reference image');
    expect(start).toHaveAttribute('data-size', 'sm');
    expect(ref).toHaveAttribute('data-size', 'smWide');
    expect(ref).toHaveStyle({ width: '256px', height: '144px' });
    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('REF')).toBeInTheDocument();
  });

  it('uses md thumb scale when requested (INP)', () => {
    renderDrawer(
      <BottomDrawer
        items={[{ ...items[1]!, width: 1920, height: 1080 }]}
        thumbScale="md"
        onRemoveTag={vi.fn()}
      />,
    );

    const ref = screen.getByLabelText('Reference image');
    expect(ref).toHaveAttribute('data-size', 'mdWide');
    expect(ref).toHaveStyle({ width: '512px', height: '288px' });
  });

  it('renders staging items without a role badge', () => {
    renderDrawer(<BottomDrawer items={[items[2]!]} onRemoveTag={vi.fn()} />);

    expect(screen.getByLabelText('Gallery image')).toBeInTheDocument();
    expect(screen.queryByText('REF')).not.toBeInTheDocument();
    expect(screen.queryByText('STR')).not.toBeInTheDocument();
  });

  it('removes a tag on hover X press', async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();

    renderDrawer(<BottomDrawer items={items.slice(0, 1)} onRemoveTag={onRemoveTag} />);

    const startCard = screen.getByLabelText('Start frame');
    await user.hover(startCard);
    await user.click(within(startCard).getByRole('button', { name: 'Remove tag' }));

    expect(onRemoveTag).toHaveBeenCalledWith('img-1', 'start', undefined);
  });

  it('exposes a drop target hook on the drawer root', () => {
    renderDrawer(<BottomDrawer items={items.slice(0, 1)} onRemoveTag={vi.fn()} />);

    expect(screen.getByRole('region', { name: 'Tagged gallery assets' })).toHaveAttribute(
      'data-drop-target',
      'bottom-drawer',
    );
  });

  it('marks the drawer open while dragging so scrollbars stay hidden', () => {
    renderDrawer(<BottomDrawer items={items.slice(0, 1)} onRemoveTag={vi.fn()} open />);

    expect(screen.getByRole('region', { name: 'Tagged gallery assets' })).toHaveClass(/open/);
  });

  it('opens the full-screen image viewer when a thumbnail is clicked', async () => {
    const user = userEvent.setup();
    renderDrawer(<BottomDrawer items={items.slice(0, 1)} onRemoveTag={vi.fn()} />);

    await user.click(screen.getByRole('img', { name: 'Start frame' }));

    expect(screen.getByRole('button', { name: 'Close image' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Start frame' }).length).toBeGreaterThan(1);
  });

  it('shows load prompt and load model controls when handlers are set', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    const onLoadModel = vi.fn();

    renderDrawer(
      <BottomDrawer
        items={items.slice(0, 1)}
        onRemoveTag={vi.fn()}
        onLoad={onLoad}
        onLoadModel={onLoadModel}
      />,
    );

    const startCard = screen.getByLabelText('Start frame');
    await user.hover(startCard);
    await user.click(within(startCard).getByRole('button', { name: 'Copy prompt' }));
    await user.click(within(startCard).getByRole('button', { name: 'Load saved model' }));

    expect(onLoad).toHaveBeenCalledWith('img-1');
    expect(onLoadModel).toHaveBeenCalledWith('img-1');
  });
});
