import { useState, type DragEvent } from 'react';
import type { SavedImageRef } from '../../../types/savedImage';
import { scalePixelsToThumb } from '../../../services/thumbScale/thumbScaleService';
import { Gallery, GalleryTile, type GalleryItem, type GallerySortableApi } from '../Gallery';
import galleryStyles from '../Gallery/Gallery.module.css';
import {
  aspectToImgContainerSize,
  type GalleryThumbScale,
} from '../ImgContainer/aspectPreviewSizes';
import { IMG_CONTAINER_SIZES } from '../ImgContainer/imgContainerSizes';
import { ImgViewer } from '../ImgViewer/ImgViewer';
import { setLuxnovaAssetDragData } from '../../../utils/luxnovaAssetDrag';
import { bottomDrawerRoleLabel } from '../BottomDrawer/bottomDrawerItems';
import styles from './SavedImagesGallery.module.css';

function thumbSizeForImage(
  image: SavedImageRef,
  scale: GalleryThumbScale,
): {
  size: ReturnType<typeof aspectToImgContainerSize>;
  width?: number;
  height?: number;
} {
  const pixelWidth = image.metadata?.width;
  const pixelHeight = image.metadata?.height;
  if (
    typeof pixelWidth === 'number' &&
    typeof pixelHeight === 'number' &&
    pixelWidth > 0 &&
    pixelHeight > 0
  ) {
    const frame = scalePixelsToThumb(pixelWidth, pixelHeight, scale);
    return { size: aspectToImgContainerSize(image.metadata?.aspect, scale), ...frame };
  }

  const size = aspectToImgContainerSize(image.metadata?.aspect, scale);
  const def = IMG_CONTAINER_SIZES[size];
  const frame = scalePixelsToThumb(def.width, def.height, scale);
  return { size, ...frame };
}

/** Frame role for an image: start, end, ref, or neither. */
export type FrameRoleState = 'start' | 'end' | 'ref' | 'none';

export type FrameRole = 'start' | 'end';

export interface SavedImagesGalleryProps {
  images: SavedImageRef[];
  thumbUrls: Record<string, string>;
  onReorder?: (next: SavedImageRef[]) => void | Promise<void>;
  /** Remove from gallery only (X). */
  onDelete: (imageId: string) => void;
  /** Remove from gallery and delete library asset (trash). */
  onTrash?: (imageId: string) => void;
  /** When set, each thumb shows a Load control (propose stored prompt). */
  onLoad?: (imageId: string) => void;
  /** When set, each thumb shows a model control (apply generation settings). */
  onLoadModel?: (imageId: string) => void;
  emptyLabel?: string;
  imageAltFallback?: string;
  className?: string;
  /** When set, gallery supports assigning start/end frame roles. */
  startImageId?: string | null;
  endImageId?: string | null;
  refImageIds?: string[];
  bgImageIds?: string[];
  tileImageIds?: string[];
  propImageIds?: string[];
  onAssignStart?: (imageId: string) => void;
  onAssignEnd?: (imageId: string) => void;
  onClearStart?: () => void;
  onClearEnd?: () => void;
  /** When set, the Ref role button becomes an interactive toggle (Ref2V). */
  onToggleRef?: (imageId: string) => void;
  /** GAME: Prop / Tile / BG type toggles (BG may be on many images). */
  onToggleGameRole?: (imageId: string, role: 'prop' | 'tile' | 'background') => void;
  /** Show the End role toggle (start→end models). */
  showEndRole?: boolean;
  /** Show Ref role badge; interactive only when `onToggleRef` is set. */
  showRefRole?: boolean;
  /** Show Prop / Tile / BG toggles (GAME gallery). */
  showGameRoles?: boolean;
  /** Thumbnail size for the gallery list (`sm` = max 256px, `md` = max 512px longest side). */
  thumbScale?: GalleryThumbScale;
  /**
   * Native HTML5 drag of the image asset id (e.g. GAME map). When set,
   * in-gallery reorder is typically omitted by the host.
   */
  enableAssetDrag?: boolean;
  /** After fullscreen Copy/Update — refresh gallery list + thumbs. */
  onAssetsChanged?: (result: {
    mode: 'copy' | 'update';
    ref: SavedImageRef;
  }) => void | Promise<void>;
}

function imageAlt(image: SavedImageRef, fallback: string): string {
  return image.metadata?.short || image.metadata?.visual || fallback;
}

function imageToItem(image: SavedImageRef, fallback: string, thumbUrl?: string): GalleryItem {
  return {
    id: image.id,
    kind: 'image',
    label: imageAlt(image, fallback),
    thumbUrl,
    width: image.metadata?.width,
    height: image.metadata?.height,
  };
}

function ImageTile({
  image,
  item,
  sortable,
  onDelete,
  onTrash,
  onLoad,
  onLoadModel,
  onOpen,
  role,
  gameRole,
  showRoles,
  showEndRole,
  showRefRole,
  showGameRoles,
  onAssignStart,
  onAssignEnd,
  onClearStart,
  onClearEnd,
  onToggleRef,
  onToggleGameRole,
  thumbScale,
  enableAssetDrag,
}: {
  image: SavedImageRef;
  item: GalleryItem;
  sortable?: GallerySortableApi;
  onDelete: (imageId: string) => void;
  onTrash?: (imageId: string) => void;
  onLoad?: (imageId: string) => void;
  onLoadModel?: (imageId: string) => void;
  onOpen: (src: string, alt: string) => void;
  role: FrameRoleState;
  gameRole: 'prop' | 'tile' | 'background' | 'none';
  showRoles: boolean;
  showEndRole: boolean;
  showRefRole: boolean;
  showGameRoles: boolean;
  onAssignStart?: (imageId: string) => void;
  onAssignEnd?: (imageId: string) => void;
  onClearStart?: () => void;
  onClearEnd?: () => void;
  onToggleRef?: (imageId: string) => void;
  onToggleGameRole?: (imageId: string, role: 'prop' | 'tile' | 'background') => void;
  thumbScale: GalleryThumbScale;
  enableAssetDrag?: boolean;
}) {
  const fromMetadata = thumbSizeForImage(image, thumbScale);
  const hasPixelMeta =
    typeof image.metadata?.width === 'number' && typeof image.metadata?.height === 'number';
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const measuredFrame =
    !hasPixelMeta && naturalSize
      ? scalePixelsToThumb(naturalSize.width, naturalSize.height, thumbScale)
      : null;
  const thumbSize = measuredFrame
    ? { size: fromMetadata.size, ...measuredFrame }
    : fromMetadata;

  const handleToggleStart = () => {
    if (role === 'start') {
      onClearStart?.();
      return;
    }
    onAssignStart?.(image.id);
  };

  const handleToggleEnd = () => {
    if (role === 'end') {
      onClearEnd?.();
      return;
    }
    onAssignEnd?.(image.id);
  };

  return (
    <GalleryTile
      item={item}
      sortable={sortable}
      size={thumbSize.size}
      width={thumbSize.width}
      height={thumbSize.height}
      onLoad={onLoad}
      loadLabel="Copy prompt"
      onLoadModel={onLoadModel}
      loadModelLabel="Load saved model"
      onTrash={onTrash}
      trashLabel="Delete image from library"
      onDelete={onDelete}
      deleteLabel="Remove image from gallery"
      chrome={
        showRoles ? (
          <div
            className={styles.roleBar}
            data-gallery-idle={role === 'none' && gameRole === 'none' ? '' : undefined}
          >
            {onAssignStart || onClearStart ? (
              <button
                type="button"
                className={[
                  styles.roleButton,
                  styles.roleButtonWide,
                  role === 'start' ? styles.roleButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={role === 'start'}
                aria-label="Start frame"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleStart();
                }}
              >
                {bottomDrawerRoleLabel('start')}
              </button>
            ) : null}
            {showEndRole ? (
              <button
                type="button"
                className={[
                  styles.roleButton,
                  styles.roleButtonWide,
                  role === 'end' ? styles.roleButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={role === 'end'}
                aria-label="End frame"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleEnd();
                }}
              >
                {bottomDrawerRoleLabel('end')}
              </button>
            ) : null}
            {showRefRole ? (
              <button
                type="button"
                className={[
                  styles.roleButton,
                  styles.roleButtonWide,
                  role === 'ref' ? styles.roleButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={role === 'ref'}
                aria-label="Ref frame"
                disabled={!onToggleRef}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleRef?.(image.id);
                }}
              >
                {bottomDrawerRoleLabel('ref')}
              </button>
            ) : null}
            {showGameRoles ? (
              <>
                <button
                  type="button"
                  className={[
                    styles.roleButton,
                    styles.roleButtonWide,
                    gameRole === 'prop' ? styles.roleButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={gameRole === 'prop'}
                  aria-label="Prop"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleGameRole?.(image.id, 'prop');
                  }}
                >
                  Prop
                </button>
                <button
                  type="button"
                  className={[
                    styles.roleButton,
                    styles.roleButtonWide,
                    gameRole === 'tile' ? styles.roleButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={gameRole === 'tile'}
                  aria-label="Tile"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleGameRole?.(image.id, 'tile');
                  }}
                >
                  Tile
                </button>
                <button
                  type="button"
                  className={[
                    styles.roleButton,
                    styles.roleButtonWide,
                    gameRole === 'background' ? styles.roleButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={gameRole === 'background'}
                  aria-label="Background"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleGameRole?.(image.id, 'background');
                  }}
                >
                  BG
                </button>
              </>
            ) : null}
          </div>
        ) : null
      }
    >
      {item.thumbUrl ? (
        <img
          src={item.thumbUrl}
          alt={item.label}
          draggable={Boolean(enableAssetDrag)}
          className={galleryStyles.thumbImage}
          onDragStart={
            enableAssetDrag
              ? (event: DragEvent<HTMLImageElement>) => {
                  setLuxnovaAssetDragData(event.dataTransfer, image.id);
                }
              : undefined
          }
          onLoad={(event) => {
            if (hasPixelMeta) {
              return;
            }
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) {
              setNaturalSize({ width: naturalWidth, height: naturalHeight });
            }
          }}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item.thumbUrl!, item.label);
          }}
        />
      ) : (
        <span className={galleryStyles.thumbPlaceholder} aria-hidden="true" />
      )}
    </GalleryTile>
  );
}

export function SavedImagesGallery({
  images,
  thumbUrls,
  onReorder,
  onDelete,
  onTrash,
  onLoad,
  onLoadModel,
  emptyLabel = 'No saved images',
  imageAltFallback = 'Saved image',
  className,
  startImageId = null,
  endImageId = null,
  refImageIds,
  bgImageIds,
  tileImageIds,
  propImageIds,
  onAssignStart,
  onAssignEnd,
  onClearStart,
  onClearEnd,
  onToggleRef,
  onToggleGameRole,
  showEndRole = false,
  showRefRole = false,
  showGameRoles = false,
  thumbScale = 'md',
  enableAssetDrag = false,
  onAssetsChanged,
}: SavedImagesGalleryProps) {
  const [viewer, setViewer] = useState<{ src: string; alt: string; assetId: string } | null>(
    null,
  );
  const showRoles = Boolean(onAssignStart || onAssignEnd || showRefRole || showGameRoles);
  const refIdSet = new Set(refImageIds ?? []);
  const tileIdSet = new Set(tileImageIds ?? []);
  const propIdSet = new Set(propImageIds ?? []);
  const bgIdSet = new Set(bgImageIds ?? []);
  const items = images.map((image) => imageToItem(image, imageAltFallback, thumbUrls[image.id]));
  const classes = [styles.fill, className].filter(Boolean).join(' ');

  return (
    <>
      <Gallery
        items={items}
        emptyLabel={emptyLabel}
        label="Saved images"
        className={classes}
        onReorder={
          enableAssetDrag || !onReorder
            ? undefined
            : (orderedIds) => {
                const byId = new Map(images.map((image) => [image.id, image]));
                onReorder(orderedIds.flatMap((id) => byId.get(id) ?? []));
              }
        }
        renderTile={({ item, sortable }) => {
          const image = images.find((entry) => entry.id === item.id);
          if (!image) {
            return null;
          }
          const role: FrameRoleState =
            startImageId === image.id
              ? 'start'
              : endImageId === image.id
                ? 'end'
                : refIdSet.has(image.id)
                  ? 'ref'
                  : 'none';
          const gameRole =
            bgIdSet.has(image.id)
              ? 'background'
              : tileIdSet.has(image.id)
                ? 'tile'
                : propIdSet.has(image.id)
                  ? 'prop'
                  : 'none';
          return (
            <ImageTile
              image={image}
              item={item}
              sortable={sortable}
              onDelete={onDelete}
              onTrash={onTrash}
              onLoad={onLoad}
              onLoadModel={onLoadModel}
              onOpen={(src, alt) => setViewer({ src, alt, assetId: image.id })}
              role={role}
              gameRole={gameRole}
              showRoles={showRoles}
              showEndRole={showEndRole}
              showRefRole={showRefRole}
              showGameRoles={showGameRoles}
              onAssignStart={onAssignStart}
              onAssignEnd={onAssignEnd}
              onClearStart={onClearStart}
              onClearEnd={onClearEnd}
              onToggleRef={onToggleRef}
              onToggleGameRole={onToggleGameRole}
              thumbScale={thumbScale}
              enableAssetDrag={enableAssetDrag}
            />
          );
        }}
      />
      {viewer ? (
        <ImgViewer
          src={viewer.src}
          alt={viewer.alt}
          assetId={viewer.assetId}
          onClose={() => setViewer(null)}
          onAssetsChanged={onAssetsChanged}
        />
      ) : null}
    </>
  );
}
