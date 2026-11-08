import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { NotificationProvider } from '../../notification/Notification/NotificationProvider';
import { ImgViewer } from './ImgViewer';

vi.mock('../../../utils/resizeImageBlob', () => ({
  resizeImageBlob: vi.fn(async (_blob: Blob, size: { width: number; height: number }) => {
    return new Blob([`resized-${size.width}x${size.height}`], { type: 'image/png' });
  }),
}));

vi.mock('../../../services/storage/imageStorage', () => ({
  loadImage: vi.fn(async () => new Blob(['source'], { type: 'image/png' })),
  saveImage: vi.fn(async () => ({
    id: 'new-id',
    fileName: 'luxNova-img-new-id.png',
    path: '/luxnova/assets/img/luxNova-img-new-id.png',
    createdAt: '2026-01-01T00:00:00.000Z',
    metadata: { width: 512, height: 384 },
  })),
  updateImage: vi.fn(async (id: string) => ({
    id,
    fileName: `luxNova-img-${id}.png`,
    path: `/luxnova/assets/img/luxNova-img-${id}.png`,
    createdAt: '2026-01-01T00:00:00.000Z',
    metadata: { width: 512, height: 384 },
  })),
}));

vi.mock('../../../services/storage/persistenceService', () => ({
  loadAsset: vi.fn(async (id: string) => ({
    id,
    name: 'Portrait',
    blobPath: `/luxnova/assets/img/luxNova-img-${id}.png`,
    fileName: `luxNova-img-${id}.png`,
    metadata: {
      visual: 'Portrait prompt',
      width: 1024,
      height: 768,
      seed: 7,
    },
  })),
}));

function renderViewer(ui: ReactNode) {
  return render(<NotificationProvider>{ui}</NotificationProvider>);
}

async function hydrateImage(alt = 'Portrait', width = 1024, height = 768) {
  const image = screen.getByRole('img', { name: alt });
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: width });
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: height });
  image.dispatchEvent(new Event('load'));
  await waitFor(() => {
    expect(screen.getByRole('textbox', { name: 'Width' })).toHaveValue(String(width));
  });
}

describe('ImgViewer', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(['source'], { type: 'image/png' }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the image over a mask and closes from the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderViewer(<ImgViewer src="blob:preview" alt="Portrait" onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'Portrait' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Portrait' })).toBeInTheDocument();

    await user.hover(screen.getByRole('img', { name: 'Portrait' }));
    await user.click(screen.getByRole('button', { name: 'Close image' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the image is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderViewer(<ImgViewer src="blob:preview" alt="Portrait" onClose={onClose} />);

    await user.click(screen.getByRole('img', { name: 'Portrait' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the mask is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderViewer(<ImgViewer src="blob:preview" alt="Portrait" onClose={onClose} />);

    await user.click(screen.getByRole('dialog', { name: 'Portrait' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies resize to the working copy then saves a Copy', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAssetsChanged = vi.fn();
    const { resizeImageBlob } = await import('../../../utils/resizeImageBlob');
    const { saveImage } = await import('../../../services/storage/imageStorage');
    const { loadAsset } = await import('../../../services/storage/persistenceService');

    renderViewer(
      <ImgViewer
        src="blob:preview"
        alt="Portrait"
        assetId="img-1"
        onClose={onClose}
        onAssetsChanged={onAssetsChanged}
      />,
    );

    await hydrateImage('Portrait', 1024, 768);

    await user.clear(screen.getByRole('textbox', { name: 'Width' }));
    await user.type(screen.getByRole('textbox', { name: 'Width' }), '512');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(resizeImageBlob).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: 'Save edits' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Save edits' }));
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(saveImage).toHaveBeenCalled();
      expect(loadAsset).toHaveBeenCalledWith('new-id');
      expect(onAssetsChanged).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'copy', ref: expect.objectContaining({ id: 'new-id' }) }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('resets the working copy without closing the viewer', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { resizeImageBlob } = await import('../../../utils/resizeImageBlob');

    renderViewer(
      <ImgViewer src="blob:preview" alt="Portrait" assetId="img-1" onClose={onClose} />,
    );

    await hydrateImage('Portrait', 100, 100);

    await user.clear(screen.getByRole('textbox', { name: 'Width' }));
    await user.type(screen.getByRole('textbox', { name: 'Width' }), '50');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(resizeImageBlob).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: 'Reset edits' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Reset edits' }));
    expect(screen.getByRole('button', { name: 'Save edits' })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables Copy/Update without assetId after entering save mode', async () => {
    const user = userEvent.setup();
    const { resizeImageBlob } = await import('../../../utils/resizeImageBlob');

    renderViewer(<ImgViewer src="blob:preview" alt="Portrait" onClose={vi.fn()} />);

    await hydrateImage('Portrait', 64, 64);

    await user.clear(screen.getByRole('textbox', { name: 'Width' }));
    await user.type(screen.getByRole('textbox', { name: 'Width' }), '32');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(resizeImageBlob).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: 'Save edits' }));
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  });
});
