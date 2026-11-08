import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SavedImageRef } from '../../../types/savedImage';
import { SavedImagesGallery } from './SavedImagesGallery';

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: ReactNode;
      onDragEnd?: (event: { active: { id: string }; over: { id: string } | null }) => void;
    }) => (
      <div>
        <button
          type="button"
          onClick={() =>
            onDragEnd?.({
              active: { id: 'img-1' },
              over: { id: 'img-2' },
            })
          }
        >
          Simulate reorder
        </button>
        {children}
      </div>
    ),
  };
});

const sampleImages: SavedImageRef[] = [
  {
    id: 'img-1',
    fileName: 'a.png',
    path: '/luxnova/img/a.png',
    createdAt: '2026-01-01T00:00:00.000Z',
    metadata: { short: 'First portrait' },
  },
  {
    id: 'img-2',
    fileName: 'b.png',
    path: '/luxnova/img/b.png',
    createdAt: '2026-01-02T00:00:00.000Z',
    metadata: { short: 'Second portrait' },
  },
];

describe('SavedImagesGallery', () => {
  it('shows empty state when there are no images', () => {
    render(
      <SavedImagesGallery images={[]} thumbUrls={{}} onReorder={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText('No saved images')).toBeInTheDocument();
  });

  it('renders saved image thumbnails', () => {
    render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{
          'img-1': 'blob:one',
          'img-2': 'blob:two',
        }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'First portrait' })).toHaveAttribute('src', 'blob:one');
    expect(screen.getByRole('img', { name: 'Second portrait' })).toHaveAttribute(
      'src',
      'blob:two',
    );
  });

  it('makes thumbs natively draggable when enableAssetDrag is set', () => {
    render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
        enableAssetDrag
      />,
    );

    expect(screen.getByRole('img', { name: 'First portrait' })).toHaveAttribute('draggable', 'true');
    expect(screen.queryByRole('button', { name: 'Simulate reorder' })).not.toBeInTheDocument();
  });

  it('uses a wide container for 16:9 saved images', () => {
    render(
      <SavedImagesGallery
        images={[
          {
            ...sampleImages[0]!,
            metadata: { short: 'Wide portrait', aspect: '16:9' },
          },
        ]}
        thumbUrls={{ 'img-1': 'blob:wide' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const thumb = screen.getByRole('img', { name: 'Wide portrait' }).parentElement?.parentElement;
    expect(thumb).toHaveAttribute('data-size', 'mdWide');
    // Best-fit into md 16:9 box (512×288).
    expect(thumb).toHaveStyle({ width: '512px', height: '288px' });
  });

  it('sizes thumbs from stored pixel dimensions', () => {
    render(
      <SavedImagesGallery
        images={[
          {
            ...sampleImages[0]!,
            metadata: {
              short: 'Custom landscape',
              width: 1920,
              height: 1080,
            },
          },
        ]}
        thumbUrls={{ 'img-1': 'blob:custom' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const thumb = screen.getByRole('img', { name: 'Custom landscape' }).parentElement
      ?.parentElement;
    expect(thumb).toHaveStyle({ width: '512px', height: '288px' });
  });

  it('keeps small pixel thumbs at native size', () => {
    render(
      <SavedImagesGallery
        images={[
          {
            ...sampleImages[0]!,
            metadata: {
              short: 'Tiny square',
              width: 96,
              height: 96,
            },
          },
        ]}
        thumbUrls={{ 'img-1': 'blob:tiny' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const thumb = screen.getByRole('img', { name: 'Tiny square' }).parentElement?.parentElement;
    expect(thumb).toHaveStyle({ width: '96px', height: '96px' });
  });

  it('calls onDelete for a saved image', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Remove image from gallery' })[0]!);
    expect(onDelete).toHaveBeenCalledWith('img-1');
  });

  it('shows Load only when onLoad is provided', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();

    const { rerender } = render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Copy prompt' })).not.toBeInTheDocument();

    rerender(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
        onLoad={onLoad}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Copy prompt' })[0]!);
    expect(onLoad).toHaveBeenCalledWith('img-1');
  });

  it('shows model Load only when onLoadModel is provided', async () => {
    const user = userEvent.setup();
    const onLoadModel = vi.fn();

    const { rerender } = render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Load saved model' })).not.toBeInTheDocument();

    rerender(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
        onLoadModel={onLoadModel}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Load saved model' })[0]!);
    expect(onLoadModel).toHaveBeenCalledWith('img-1');
  });

  it('calls onReorder when a drag ends over another item', async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();

    render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={onReorder}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Simulate reorder' }));

    expect(onReorder).toHaveBeenCalledWith([sampleImages[1], sampleImages[0]]);
  });

  it('toggles Start and End independently (mutual exclusive)', async () => {
    const user = userEvent.setup();
    const onAssignStart = vi.fn();
    const onAssignEnd = vi.fn();
    const onClearStart = vi.fn();
    const onClearEnd = vi.fn();

    const { rerender } = render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
        startImageId={null}
        endImageId={null}
        showEndRole
        onAssignStart={onAssignStart}
        onAssignEnd={onAssignEnd}
        onClearStart={onClearStart}
        onClearEnd={onClearEnd}
      />,
    );

    const startButtons = () => screen.getAllByRole('button', { name: 'Start frame' });
    const endButtons = () => screen.getAllByRole('button', { name: 'End frame' });

    expect(startButtons()[0]).toHaveAttribute('aria-pressed', 'false');
    expect(endButtons()[0]).toHaveAttribute('aria-pressed', 'false');

    await user.click(startButtons()[0]!);
    expect(onAssignStart).toHaveBeenCalledWith('img-1');

    rerender(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
        startImageId="img-1"
        endImageId={null}
        showEndRole
        onAssignStart={onAssignStart}
        onAssignEnd={onAssignEnd}
        onClearStart={onClearStart}
        onClearEnd={onClearEnd}
      />,
    );

    expect(startButtons()[0]).toHaveAttribute('aria-pressed', 'true');
    await user.click(startButtons()[0]!);
    expect(onClearStart).toHaveBeenCalled();

    await user.click(endButtons()[0]!);
    expect(onAssignEnd).toHaveBeenCalledWith('img-1');

    rerender(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
        startImageId={null}
        endImageId="img-1"
        showEndRole
        onAssignStart={onAssignStart}
        onAssignEnd={onAssignEnd}
        onClearStart={onClearStart}
        onClearEnd={onClearEnd}
      />,
    );

    expect(endButtons()[0]).toHaveAttribute('aria-pressed', 'true');
    await user.click(endButtons()[0]!);
    expect(onClearEnd).toHaveBeenCalled();
  });

  it('shows Ref as pressed when image id is in refImageIds', () => {
    render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:1' }}
        onReorder={() => undefined}
        onDelete={() => undefined}
        startImageId={null}
        endImageId={null}
        refImageIds={['img-1']}
        onAssignStart={() => undefined}
        showRefRole
      />,
    );

    const refButtons = screen.getAllByRole('button', { name: 'Ref frame' });
    expect(refButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(refButtons[0]).toBeDisabled();
    expect(refButtons[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles Ref when onToggleRef is provided (Ref2V)', async () => {
    const user = userEvent.setup();
    const onToggleRef = vi.fn();

    render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:1', 'img-2': 'blob:2' }}
        onReorder={() => undefined}
        onDelete={() => undefined}
        refImageIds={['img-1']}
        onToggleRef={onToggleRef}
        showRefRole
      />,
    );

    const refButtons = screen.getAllByRole('button', { name: 'Ref frame' });
    expect(refButtons[0]).not.toBeDisabled();
    expect(refButtons[1]).not.toBeDisabled();

    await user.click(refButtons[1]!);
    expect(onToggleRef).toHaveBeenCalledWith('img-2');
  });

  it('hides the Start button when no start handlers are provided (Ref2V)', () => {
    render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:1', 'img-2': 'blob:2' }}
        onReorder={() => undefined}
        onDelete={() => undefined}
        refImageIds={['img-1']}
        onToggleRef={() => undefined}
        showRefRole
      />,
    );

    expect(screen.queryByRole('button', { name: 'Start frame' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Ref frame' })).toHaveLength(2);
  });

  it('toggles exclusive GAME Prop / Tile / BG roles', async () => {
    const user = userEvent.setup();
    const onToggleGameRole = vi.fn();

    const { rerender } = render(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onDelete={vi.fn()}
        showGameRoles
        onToggleGameRole={onToggleGameRole}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Start frame' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Prop' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Tile' })).toHaveLength(2);
    const bgButtons = () => screen.getAllByRole('button', { name: 'Background' });
    expect(bgButtons()[0]).toHaveAttribute('aria-pressed', 'false');

    await user.click(bgButtons()[0]!);
    expect(onToggleGameRole).toHaveBeenCalledWith('img-1', 'background');

    rerender(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onDelete={vi.fn()}
        showGameRoles
        bgImageIds={['img-1']}
        tileImageIds={[]}
        propImageIds={[]}
        onToggleGameRole={onToggleGameRole}
      />,
    );

    expect(bgButtons()[0]).toHaveAttribute('aria-pressed', 'true');
    expect(bgButtons()[1]).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByRole('button', { name: 'Tile' })[0]).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getAllByRole('button', { name: 'Tile' })[0]!);
    expect(onToggleGameRole).toHaveBeenCalledWith('img-1', 'tile');

    rerender(
      <SavedImagesGallery
        images={sampleImages}
        thumbUrls={{ 'img-1': 'blob:one', 'img-2': 'blob:two' }}
        onDelete={vi.fn()}
        showGameRoles
        bgImageIds={['img-1', 'img-2']}
        tileImageIds={[]}
        propImageIds={[]}
        onToggleGameRole={onToggleGameRole}
      />,
    );
    expect(bgButtons()[0]).toHaveAttribute('aria-pressed', 'true');
    expect(bgButtons()[1]).toHaveAttribute('aria-pressed', 'true');
  });
});
