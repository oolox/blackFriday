import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryUploadHeader } from './GalleryUploadHeader';

describe('GalleryUploadHeader', () => {
  it('puts upload and thumbnail controls in SubSubHeader nav', async () => {
    const user = userEvent.setup();
    const onToggleThumbScale = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <GalleryUploadHeader
        fileInputRef={fileInputRef}
        onFilesSelected={() => {}}
        accept="image/png"
        uploadLabel="Add images, videos, or texts"
        thumbScale="md"
        onToggleThumbScale={onToggleThumbScale}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Gallery actions' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use small thumbnails' }));
    expect(onToggleThumbScale).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Add images, videos, or texts' })).toBeInTheDocument();
  });
});
