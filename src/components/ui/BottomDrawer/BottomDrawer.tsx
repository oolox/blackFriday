import { useEffect, useState, type TransitionEvent } from 'react';
import { inferImageAspectRatio } from '../../../utils/aspectRatio';
import { formatAudioDuration } from '../../../utils/audioMime';
import {
  scalePixelsToThumb,
  thumbBoundsForScale,
  type ThumbScale,
} from '../../../services/thumbScale/thumbScaleService';
import { aspectToImgContainerSize } from '../ImgContainer/aspectPreviewSizes';
import { ImgContainer } from '../ImgContainer/ImgContainer';
import {
  IMG_CONTAINER_SIZES,
  type ImgContainerSize,
} from '../ImgContainer/imgContainerSizes';
import { ImgViewer } from '../ImgViewer/ImgViewer';
import { Icon } from '../Icon/Icon';
import {
  bottomDrawerRoleLabel,
  type BottomDrawerItem,
  type BottomDrawerTagRole,
} from './bottomDrawerItems';
import styles from './BottomDrawer.module.css';

export type { BottomDrawerItem, BottomDrawerTagRole } from './bottomDrawerItems';
export {
  buildBottomDrawerItems,
  resolveGeneratorDropRole,
} from './bottomDrawerItems';

const DEFAULT_DRAWER_THUMB_SCALE: ThumbScale = 'sm';

function expandedMaxHeightPx(thumbScale: ThumbScale): number {
  return thumbBoundsForScale(thumbScale).height + 16 + 14;
}

interface ThumbFrame {
  size: ImgContainerSize;
  width: number;
  height: number;
}

function frameFromPixels(
  width: number,
  height: number,
  thumbScale: ThumbScale,
  aspect?: BottomDrawerItem['aspect'],
): ThumbFrame {
  const size = aspectToImgContainerSize(aspect, thumbScale);
  const box = scalePixelsToThumb(width, height, thumbScale);
  return { size, ...box };
}

function frameFromAspect(
  aspect: BottomDrawerItem['aspect'],
  thumbScale: ThumbScale,
): ThumbFrame {
  const size = aspectToImgContainerSize(aspect, thumbScale);
  const def = IMG_CONTAINER_SIZES[size];
  const box = scalePixelsToThumb(def.width, def.height, thumbScale);
  return { size, ...box };
}

function initialFrame(item: BottomDrawerItem, thumbScale: ThumbScale): ThumbFrame {
  if (
    typeof item.width === 'number' &&
    typeof item.height === 'number' &&
    item.width > 0 &&
    item.height > 0
  ) {
    return frameFromPixels(item.width, item.height, thumbScale, item.aspect);
  }
  return frameFromAspect(item.aspect, thumbScale);
}

export interface BottomDrawerProps {
  items: BottomDrawerItem[];
  onRemoveTag: (
    imageId: string,
    role?: BottomDrawerTagRole,
    kind?: 'image' | 'audio',
  ) => void;
  /** Load stored prompt into the generator (same as gallery). */
  onLoad?: (imageId: string) => void;
  /** Load stored model settings into the generator (same as gallery). */
  onLoadModel?: (imageId: string) => void;
  /** Highlight while dragging a gallery image over the generator. */
  open?: boolean;
  /** Thumb bounding scale. INP uses `md`; REF / video default `sm`. */
  thumbScale?: ThumbScale;
  className?: string;
}

function DrawerThumbnail({
  item,
  thumbScale,
  onRemoveTag,
  onLoad,
  onLoadModel,
  onOpen,
}: {
  item: BottomDrawerItem;
  thumbScale: ThumbScale;
  onRemoveTag: (imageId: string, role?: BottomDrawerTagRole, kind?: 'image' | 'audio') => void;
  onLoad?: (imageId: string) => void;
  onLoadModel?: (imageId: string) => void;
  onOpen: (src: string, alt: string, assetId: string) => void;
}) {
  const [frame, setFrame] = useState<ThumbFrame>(() => initialFrame(item, thumbScale));
  const [hasPixelMeta, setHasPixelMeta] = useState(
    () =>
      typeof item.width === 'number' &&
      typeof item.height === 'number' &&
      item.width > 0 &&
      item.height > 0,
  );
  const roleLabel = item.role ? bottomDrawerRoleLabel(item.role) : null;
  const isAudio = item.kind === 'audio';

  useEffect(() => {
    setFrame(initialFrame(item, thumbScale));
    setHasPixelMeta(
      typeof item.width === 'number' &&
        typeof item.height === 'number' &&
        item.width > 0 &&
        item.height > 0,
    );
  }, [item.aspect, item.width, item.height, item.imageId, thumbScale]);

  return (
    <li className={styles.item}>
      <ImgContainer
        size={frame.size}
        width={frame.width}
        height={frame.height}
        label={item.label}
        onLoad={!isAudio && onLoad ? () => onLoad(item.imageId) : undefined}
        loadLabel="Copy prompt"
        onLoadModel={!isAudio && onLoadModel ? () => onLoadModel(item.imageId) : undefined}
        loadModelLabel="Load saved model"
        onDelete={() => onRemoveTag(item.imageId, item.role, item.kind)}
        deleteLabel={item.role ? 'Remove tag' : 'Remove from drawer'}
      >
        {item.thumbUrl ? (
          <img
            src={item.thumbUrl}
            alt={item.label}
            className={styles.thumbImage}
            onLoad={(event) => {
              const img = event.currentTarget;
              if (!(img.naturalWidth > 0 && img.naturalHeight > 0)) {
                return;
              }
              if (!hasPixelMeta) {
                const inferred = inferImageAspectRatio(img.naturalWidth, img.naturalHeight);
                setFrame(
                  frameFromPixels(img.naturalWidth, img.naturalHeight, thumbScale, inferred),
                );
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
              onOpen(item.thumbUrl!, item.label, item.imageId);
            }}
          />
        ) : isAudio ? (
          <span className={styles.audioThumb}>
            <Icon name="audio-file" size={18} />
            <span className={styles.audioTitle}>{item.label}</span>
            <span className={styles.audioMeta}>{formatAudioDuration(item.durationMs)}</span>
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
      </ImgContainer>
      {roleLabel ? (
        <span className={[styles.roleBadge, styles.roleBadgeWide].join(' ')} aria-hidden="true">
          {roleLabel}
        </span>
      ) : null}
    </li>
  );
}

/** Strip of tagged gallery thumbnails under the generator SubSubHeader (REF / INP / start / end). */
export function BottomDrawer({
  items,
  onRemoveTag,
  onLoad,
  onLoadModel,
  open = false,
  thumbScale = DEFAULT_DRAWER_THUMB_SCALE,
  className,
}: BottomDrawerProps) {
  const wantsVisible = items.length > 0 || open;
  const [mounted, setMounted] = useState(wantsVisible);
  const [expanded, setExpanded] = useState(false);
  const [viewer, setViewer] = useState<{ src: string; alt: string; assetId: string } | null>(
    null,
  );

  useEffect(() => {
    if (!wantsVisible) {
      setExpanded(false);
      return;
    }

    setMounted(true);
    // Defer expand so the browser paints the collapsed frame first (slide-down).
    const timer = window.setTimeout(() => {
      setExpanded(true);
    }, 16);
    return () => {
      window.clearTimeout(timer);
    };
  }, [wantsVisible]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'max-height') {
      return;
    }
    if (!wantsVisible) {
      setMounted(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const classes = [
    styles.root,
    expanded ? styles.expanded : '',
    open ? styles.open : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const listMinHeight = thumbBoundsForScale(thumbScale).height;

  return (
    <>
      <div
        className={classes}
        role="region"
        aria-label="Tagged gallery assets"
        aria-hidden={!wantsVisible}
        data-drop-target="bottom-drawer"
        style={
          expanded
            ? { maxHeight: `${expandedMaxHeightPx(thumbScale)}px` }
            : undefined
        }
        onTransitionEnd={handleTransitionEnd}
      >
        <div className={styles.track}>
          <ul className={styles.list} style={{ minHeight: `${listMinHeight}px` }}>
            {items.map((item) => (
              <DrawerThumbnail
                key={item.key}
                item={item}
                thumbScale={thumbScale}
                onRemoveTag={onRemoveTag}
                onLoad={onLoad}
                onLoadModel={onLoadModel}
                onOpen={(src, alt, assetId) => setViewer({ src, alt, assetId })}
              />
            ))}
          </ul>
        </div>
      </div>
      {viewer ? (
        <ImgViewer
          src={viewer.src}
          alt={viewer.alt}
          assetId={viewer.assetId}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </>
  );
}
