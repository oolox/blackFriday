import { useEffect, useState } from 'react';
import { loadVideo } from '../../../services/storage/videoStorage';
import { scalePixelsToThumb } from '../../../services/thumbScale/thumbScaleService';
import type { SavedVideoRef } from '../../../types/videoPrompt';
import { useObjectUrl } from '../../../hooks/useObjectUrl';
import { Gallery, GalleryTile, type GalleryItem } from '../Gallery';
import { IconButton } from '../IconButton/IconButton';
import galleryStyles from '../Gallery/Gallery.module.css';
import { type GalleryThumbScale } from '../ImgContainer/aspectPreviewSizes';
import { IMG_CONTAINER_SIZES } from '../ImgContainer/imgContainerSizes';
import { VideoViewer } from '../VideoViewer';
import styles from './SavedVideosGallery.module.css';

export interface SavedVideosGalleryProps {
  videos: SavedVideoRef[];
  /** Poster object URLs keyed by video id (useVideoThumbs). */
  posterUrls: Record<string, string>;
  /** Remove from gallery only (X). */
  onDelete: (videoId: string) => void;
  /** Remove from gallery and delete library asset (trash). */
  onTrash?: (videoId: string) => void;
  /** When set, each card shows a Load control (propose stored prompt). */
  onLoad?: (videoId: string) => void;
  /** When set, each card shows a model control (apply generation settings). */
  onLoadModel?: (videoId: string) => void;
  /** Placeholder: extract first frame (not wired). */
  onFirstFrame?: (videoId: string) => void;
  /** Placeholder: extract last frame (not wired). */
  onLastFrame?: (videoId: string) => void;
  emptyLabel?: string;
  className?: string;
  thumbScale?: GalleryThumbScale;
  /** Optional section heading. Empty string hides it (host Collapsible owns the title). */
  heading?: string;
}

function videoAlt(video: SavedVideoRef): string {
  return video.metadata?.prompt || 'Saved video';
}

function durationLabel(video: SavedVideoRef): string | null {
  const seconds = video.metadata?.duration;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return `${Math.round(seconds)}s`;
}

function videoToItem(video: SavedVideoRef, posterUrl?: string): GalleryItem {
  return {
    id: video.id,
    kind: 'video',
    label: videoAlt(video),
    thumbUrl: posterUrl,
  };
}

function SavedVideoCard({
  video,
  item,
  onDelete,
  onTrash,
  onLoad,
  onLoadModel,
  onFirstFrame,
  onLastFrame,
  thumbScale,
}: {
  video: SavedVideoRef;
  item: GalleryItem;
  onDelete: (videoId: string) => void;
  onTrash?: (videoId: string) => void;
  onLoad?: (videoId: string) => void;
  onLoadModel?: (videoId: string) => void;
  onFirstFrame?: (videoId: string) => void;
  onLastFrame?: (videoId: string) => void;
  thumbScale: GalleryThumbScale;
}) {
  const duration = durationLabel(video);
  const def = IMG_CONTAINER_SIZES[thumbScale === 'md' ? 'md' : 'sm'];
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { objectUrl: viewerObjectUrl, setFromBlob: setViewerFromBlob, clear: clearViewer } =
    useObjectUrl();
  const frame = naturalSize
    ? scalePixelsToThumb(naturalSize.width, naturalSize.height, thumbScale)
    : { width: def.width, height: def.height };

  useEffect(() => {
    if (!viewerOpen) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const blob = await loadVideo(video.id);
        if (!cancelled) {
          setViewerFromBlob(blob);
        }
      } catch {
        if (!cancelled) {
          setViewerOpen(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [video.id, setViewerFromBlob, viewerOpen]);

  const closeViewer = () => {
    setViewerOpen(false);
    clearViewer();
  };

  return (
    <>
      <GalleryTile
        item={item}
        size={thumbScale === 'md' ? 'md' : 'sm'}
        width={frame.width}
        height={frame.height}
        onLoad={onLoad}
        loadLabel="Copy prompt"
        onLoadModel={onLoadModel}
        loadModelLabel="Load saved model"
        onTrash={onTrash}
        trashLabel="Delete video from library"
        onDelete={onDelete}
        deleteLabel="Remove video from gallery"
        chrome={
          <div className={styles.frameBar} data-gallery-idle="">
            <IconButton
              className={styles.frameButton}
              icon="skip-to-start"
              label="First frame"
              variant="secondary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onFirstFrame?.(video.id);
              }}
            />
            <IconButton
              className={styles.frameButton}
              icon="skip-to-end"
              label="Last frame"
              variant="secondary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onLastFrame?.(video.id);
              }}
            />
          </div>
        }
      >
        <span
          className={styles.cardInner}
          onClick={(event) => {
            event.stopPropagation();
            setViewerOpen(true);
          }}
        >
          {item.thumbUrl ? (
            <img
              src={item.thumbUrl}
              alt={item.label}
              className={galleryStyles.thumbImage}
              draggable={false}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth > 0 && naturalHeight > 0) {
                  setNaturalSize({ width: naturalWidth, height: naturalHeight });
                }
              }}
            />
          ) : (
            <span className={galleryStyles.thumbPlaceholder} aria-hidden="true" />
          )}
          <span className={styles.playOverlay} aria-hidden="true">
            ▶
          </span>
          {duration ? <span className={styles.durationBadge}>{duration}</span> : null}
        </span>
      </GalleryTile>
      {viewerOpen ? (
        <VideoViewer src={viewerObjectUrl} alt={item.label} onClose={closeViewer} />
      ) : null}
    </>
  );
}

/**
 * Saved-videos strip for the video generator editors.
 * Poster cards, newest first; no drag-reorder.
 * X removes the gallery ref only; trash also deletes the library asset + blobs.
 */
export function SavedVideosGallery({
  videos,
  posterUrls,
  onDelete,
  onTrash,
  onLoad,
  onLoadModel,
  onFirstFrame,
  onLastFrame,
  emptyLabel = 'No saved videos',
  className,
  thumbScale = 'sm',
  heading = 'Videos',
}: SavedVideosGalleryProps) {
  const items = videos.map((video) => videoToItem(video, posterUrls[video.id]));

  return (
    <Gallery
      items={items}
      emptyLabel={emptyLabel}
      heading={heading || undefined}
      label="Saved videos"
      className={className}
      renderTile={({ item }) => {
        const video = videos.find((entry) => entry.id === item.id);
        if (!video) {
          return null;
        }
        return (
          <SavedVideoCard
            video={video}
            item={item}
            onDelete={onDelete}
            onTrash={onTrash}
            onLoad={onLoad}
            onLoadModel={onLoadModel}
            onFirstFrame={onFirstFrame}
            onLastFrame={onLastFrame}
            thumbScale={thumbScale}
          />
        );
      }}
    />
  );
}
