import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNotification } from '../../notification/Notification/useNotification';
import { MediaViewerOverlay } from '../MediaViewerOverlay/MediaViewerOverlay';
import { loadAsset } from '../../../services/storage/persistenceService';
import {
  loadImage,
  saveImage,
  updateImage,
} from '../../../services/storage/imageStorage';
import type { SavedImageMetadata, SavedImageRef } from '../../../types/savedImage';
import { inferImageAspectRatio } from '../../../utils/aspectRatio';
import { formatFailure } from '../../../utils/formatFailure';
import { resizeImageBlob } from '../../../utils/resizeImageBlob';
import { ImageToolsDrawer } from './ImageToolsDrawer';
import styles from './ImgViewer.module.css';

export interface ImgViewerProps {
  src: string;
  alt?: string;
  /** Asset library id — required for Copy/Update persistence. */
  assetId?: string;
  onClose: () => void;
  /** After Copy (new asset) or Update (in-place). */
  onAssetsChanged?: (result: { mode: 'copy' | 'update'; ref: SavedImageRef }) => void;
}

function readImageMeta(metadata: unknown): SavedImageMetadata | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }
  return metadata as SavedImageMetadata;
}

function revokeUrl(url: string | null) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Fullscreen image viewer with a working-copy edit session.
 * Tools mutate the in-viewer copy only; Save commits Copy / Update to the library.
 */
export function ImgViewer({
  src,
  alt = '',
  assetId,
  onClose,
  onAssetsChanged,
}: ImgViewerProps) {
  const { notify } = useNotification();
  const originalBlobRef = useRef<Blob | null>(null);
  const workingBlobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState(src);
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const setWorkingPreview = useCallback((blob: Blob, nextDirty: boolean) => {
    workingBlobRef.current = blob;
    const nextUrl = URL.createObjectURL(blob);
    revokeUrl(previewUrlRef.current);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
    setDirty(nextDirty);
  }, []);

  const loadSourceBlob = useCallback(async (): Promise<Blob> => {
    if (assetId) {
      try {
        const asset = await loadAsset(assetId);
        const blob = await loadImage(asset.blobPath || assetId);
        if (blob.size > 0) {
          return blob;
        }
      } catch (error) {
        console.info('Could not load asset blob for viewer; trying src', {
          assetId,
          error,
        });
      }
    }
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error('Could not load image for viewer');
    }
    const blob = await response.blob();
    if (!(blob.size > 0)) {
      throw new Error('Image source is empty');
    }
    return blob;
  }, [assetId, src]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const blob = await loadSourceBlob();
        if (cancelled) {
          return;
        }
        originalBlobRef.current = blob;
        setWorkingPreview(blob, false);
        setReady(true);
      } catch (error) {
        console.info('Could not initialize image working copy', { assetId, error });
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      revokeUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, [assetId, loadSourceBlob, setWorkingPreview]);

  const hydrateFromImage = useCallback((image: HTMLImageElement) => {
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setImageWidth(image.naturalWidth);
      setImageHeight(image.naturalHeight);
    }
  }, []);

  const buildSaveMeta = useCallback(
    async (
      width: number,
      height: number,
    ): Promise<{
      name?: string;
      metadata: SavedImageMetadata;
    }> => {
      let previous: SavedImageMetadata | undefined;
      let name: string | undefined;
      if (assetId) {
        try {
          const asset = await loadAsset(assetId);
          previous = readImageMeta(asset.metadata);
          name = asset.name;
        } catch {
          // Still save size metadata without prior fields.
        }
      }
      return {
        name,
        metadata: {
          ...previous,
          width,
          height,
          aspect: inferImageAspectRatio(width, height),
        },
      };
    },
    [assetId],
  );

  const applyResize = useCallback(
    async (width: number, height: number) => {
      const source = workingBlobRef.current;
      if (!source || busy) {
        return;
      }
      setBusy(true);
      try {
        const resized = await resizeImageBlob(source, { width, height });
        if (!(resized.size > 0)) {
          throw new Error('Resized image was empty');
        }
        setWorkingPreview(resized, true);
        setImageWidth(width);
        setImageHeight(height);
      } catch (error) {
        console.info('Working-copy resize failed', { error });
        notify(formatFailure('resize image preview', alt || assetId, error));
      } finally {
        setBusy(false);
      }
    },
    [alt, assetId, busy, notify, setWorkingPreview],
  );

  const resetWorkingCopy = useCallback(() => {
    const original = originalBlobRef.current;
    if (!original || busy) {
      return;
    }
    setWorkingPreview(original, false);
  }, [busy, setWorkingPreview]);

  const saveWorkingCopy = useCallback(
    async (mode: 'copy' | 'update') => {
      const working = workingBlobRef.current;
      if (!working) {
        return;
      }
      if (!assetId) {
        notify('Open this image from the library or gallery to save.');
        return;
      }
      if (busy) {
        return;
      }
      setBusy(true);
      try {
        const width = imageWidth ?? 0;
        const height = imageHeight ?? 0;
        if (!(width > 0) || !(height > 0)) {
          throw new Error('Working image size is unknown');
        }
        const { name, metadata } = await buildSaveMeta(width, height);
        const ref =
          mode === 'copy'
            ? await saveImage(working, { name, metadata })
            : await updateImage(assetId, working, { name, metadata });

        if (mode === 'copy') {
          await loadAsset(ref.id);
        }

        await Promise.resolve(onAssetsChanged?.({ mode, ref }));
        notify(
          mode === 'copy'
            ? `Saved copy (${width}×${height})`
            : `Updated image (${width}×${height})`,
        );
        onClose();
      } catch (error) {
        console.info('Image save failed', { assetId, mode, error });
        notify(
          formatFailure(
            mode === 'copy' ? 'save image copy' : 'update image',
            alt || assetId,
            error,
          ),
        );
      } finally {
        setBusy(false);
      }
    },
    [
      alt,
      assetId,
      buildSaveMeta,
      busy,
      imageHeight,
      imageWidth,
      notify,
      onAssetsChanged,
      onClose,
    ],
  );

  return (
    <MediaViewerOverlay
      alt={alt}
      closeLabel="Close image"
      onClose={busy ? () => undefined : onClose}
      toolbar={
        <ImageToolsDrawer
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          canPersist={Boolean(assetId)}
          dirty={dirty}
          busy={busy || !ready}
          onApplyResize={applyResize}
          onReset={resetWorkingCopy}
          onSaveCopy={() => saveWorkingCopy('copy')}
          onSaveUpdate={() => saveWorkingCopy('update')}
        />
      }
    >
      <img
        className={styles.image}
        src={previewUrl}
        alt={alt}
        onLoad={(event) => hydrateFromImage(event.currentTarget)}
        onClick={(event: MouseEvent) => {
          event.stopPropagation();
          if (!busy) {
            onClose();
          }
        }}
      />
    </MediaViewerOverlay>
  );
}
