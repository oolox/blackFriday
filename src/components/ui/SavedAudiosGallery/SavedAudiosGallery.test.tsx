import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SavedAudioRef } from '../../../types/savedAudio';
import { SavedAudiosGallery } from './SavedAudiosGallery';

vi.mock('../../../services/storage/audioStorage', () => ({
  loadAudio: vi.fn(async () => new Blob(['x'], { type: 'audio/wav' })),
}));

const rain: SavedAudioRef = {
  id: 'aud-1',
  fileName: 'luxNova-aud-aud-1.wav',
  path: '/luxnova/assets/aud/luxNova-aud-aud-1.wav',
  createdAt: '2026-01-01T00:00:00.000Z',
  mimeType: 'audio/wav',
  metadata: { originalName: 'rain.wav', durationMs: 12_400 },
};

describe('SavedAudiosGallery', () => {
  it('renders format + duration and routes X vs trash', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onTrash = vi.fn();
    render(
      <SavedAudiosGallery
        audios={[rain]}
        onReorder={() => undefined}
        onDelete={onDelete}
        onTrash={onTrash}
      />,
    );

    expect(screen.getByText('rain.wav')).toBeInTheDocument();
    expect(screen.getByText('WAV · 0:12')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove audio from gallery' }));
    expect(onDelete).toHaveBeenCalledWith('aud-1');
    expect(onTrash).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete audio from library' }));
    expect(onTrash).toHaveBeenCalledWith('aud-1');
  });

  it('makes cards natively draggable when enableAssetDrag is set', () => {
    render(
      <SavedAudiosGallery
        audios={[rain]}
        onReorder={() => undefined}
        onDelete={vi.fn()}
        enableAssetDrag
      />,
    );

    const card = screen.getByText('rain.wav').closest('[draggable]');
    expect(card).toHaveAttribute('draggable', 'true');
  });
});
