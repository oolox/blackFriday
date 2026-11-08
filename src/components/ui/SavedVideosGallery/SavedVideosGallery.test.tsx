import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SavedVideoRef } from '../../../types/videoPrompt';
import { SavedVideosGallery } from './SavedVideosGallery';

const videos: SavedVideoRef[] = [
  {
    id: 'vid-1',
    fileName: 'luxNova-vid-vid-1.mp4',
    path: '/luxnova/assets/vid/luxNova-vid-vid-1.mp4',
    createdAt: '2026-01-01T00:00:00.000Z',
    metadata: { prompt: 'A forest walk', duration: 5 },
  },
];

describe('SavedVideosGallery', () => {
  it('renders poster cards with duration badge and load/remove/trash controls', async () => {
    const onLoad = vi.fn();
    const onDelete = vi.fn();
    const onTrash = vi.fn();
    render(
      <SavedVideosGallery
        videos={videos}
        posterUrls={{ 'vid-1': 'blob:poster-1' }}
        onLoad={onLoad}
        onDelete={onDelete}
        onTrash={onTrash}
      />,
    );

    expect(screen.getByAltText('A forest walk')).toHaveAttribute('src', 'blob:poster-1');
    expect(screen.getByText('5s')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copy prompt' }));
    expect(onLoad).toHaveBeenCalledWith('vid-1');

    await userEvent.click(screen.getByRole('button', { name: 'Remove video from gallery' }));
    expect(onDelete).toHaveBeenCalledWith('vid-1');

    await userEvent.click(screen.getByRole('button', { name: 'Delete video from library' }));
    expect(onTrash).toHaveBeenCalledWith('vid-1');

    expect(screen.getByRole('button', { name: 'First frame' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last frame' })).toBeInTheDocument();
  });

  it('invokes first and last frame callbacks', async () => {
    const onFirstFrame = vi.fn();
    const onLastFrame = vi.fn();
    render(
      <SavedVideosGallery
        videos={videos}
        posterUrls={{ 'vid-1': 'blob:poster-1' }}
        onDelete={() => undefined}
        onFirstFrame={onFirstFrame}
        onLastFrame={onLastFrame}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'First frame' }));
    expect(onFirstFrame).toHaveBeenCalledWith('vid-1');
    await userEvent.click(screen.getByRole('button', { name: 'Last frame' }));
    expect(onLastFrame).toHaveBeenCalledWith('vid-1');
  });

  it('calls onLoadModel when the model control is pressed', async () => {
    const onLoadModel = vi.fn();
    render(
      <SavedVideosGallery
        videos={videos}
        posterUrls={{ 'vid-1': 'blob:poster-1' }}
        onLoadModel={onLoadModel}
        onDelete={() => undefined}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Load saved model' }));
    expect(onLoadModel).toHaveBeenCalledWith('vid-1');
  });

  it('renders the empty label without cards', () => {
    render(<SavedVideosGallery videos={[]} posterUrls={{}} onDelete={() => undefined} />);
    expect(screen.getByText('No saved videos')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
