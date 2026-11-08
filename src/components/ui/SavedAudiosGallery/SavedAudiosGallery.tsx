import { useState, type DragEvent } from 'react';
import { loadAudio } from '../../../services/storage/audioStorage';
import type { SavedAudioRef } from '../../../types/savedAudio';
import { audioFormatLabel, formatAudioDuration } from '../../../utils/audioMime';
import { setLuxnovaAssetDragData } from '../../../utils/luxnovaAssetDrag';
import { useObjectUrl } from '../../../hooks/useObjectUrl';
import { bottomDrawerRoleLabel } from '../BottomDrawer/bottomDrawerItems';
import { AudioViewer } from '../AudioViewer';
import { Gallery, GalleryTile, type GalleryItem, type GallerySortableApi } from '../Gallery';
import { Icon } from '../Icon/Icon';
import type { GalleryThumbScale } from '../ImgContainer/aspectPreviewSizes';
import { IMG_CONTAINER_SIZES } from '../ImgContainer/imgContainerSizes';
import styles from './SavedAudiosGallery.module.css';

function audioAlt(audio: SavedAudioRef, fallback: string): string {
  return audio.metadata?.originalName || fallback;
}

function audioMeta(audio: SavedAudioRef): string {
  return `${audioFormatLabel(audio.mimeType)} · ${formatAudioDuration(audio.metadata?.durationMs)}`;
}

function audioToItem(audio: SavedAudioRef, fallback: string): GalleryItem {
  return {
    id: audio.id,
    kind: 'audio',
    label: audioAlt(audio, fallback),
  };
}

function SortableSavedAudio({
  item,
  meta,
  sortable,
  onDelete,
  onTrash,
  onOpen,
  thumbScale,
  isRef,
  showRefRole,
  onToggleRef,
  enableAssetDrag,
}: {
  item: GalleryItem;
  meta: string;
  sortable?: GallerySortableApi;
  onDelete: (audioId: string) => void;
  onTrash?: (audioId: string) => void;
  onOpen: (item: GalleryItem) => void;
  thumbScale: GalleryThumbScale;
  isRef: boolean;
  showRefRole: boolean;
  onToggleRef?: (audioId: string) => void;
  enableAssetDrag?: boolean;
}) {
  const def = IMG_CONTAINER_SIZES[thumbScale === 'md' ? 'md' : 'sm'];

  return (
    <GalleryTile
      item={item}
      sortable={sortable}
      size={thumbScale === 'md' ? 'md' : 'sm'}
      width={def.width}
      height={def.height}
      onTrash={onTrash}
      trashLabel="Delete audio from library"
      onDelete={onDelete}
      deleteLabel="Remove audio from gallery"
    >
      <span
        className={styles.cardInner}
        draggable={Boolean(enableAssetDrag)}
        onPointerDown={
          enableAssetDrag
            ? (event) => {
                // Stop dnd-kit sortable from capturing the gesture so HTML5
                // drag can leave the gallery and hit the generator REF drawer.
                event.stopPropagation();
              }
            : undefined
        }
        onDragStart={
          enableAssetDrag
            ? (event: DragEvent<HTMLSpanElement>) => {
                event.stopPropagation();
                setLuxnovaAssetDragData(event.dataTransfer, item.id);
              }
            : undefined
        }
        onClick={(event) => {
          event.stopPropagation();
          onOpen(item);
        }}
      >
        <Icon name="audio-file" size={thumbScale === 'md' ? 40 : 24} />
        <span className={styles.cardLabel}>{item.label}</span>
        <span className={styles.cardMeta}>{meta}</span>
      </span>
      {showRefRole ? (
        <div className={styles.roleBar}>
          <button
            type="button"
            className={[
              styles.roleButton,
              styles.roleButtonWide,
              isRef ? styles.roleButtonActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isRef}
            aria-label="Ref audio"
            disabled={!onToggleRef}
            onClick={(event) => {
              event.stopPropagation();
              onToggleRef?.(item.id);
            }}
          >
            {bottomDrawerRoleLabel('ref')}
          </button>
        </div>
      ) : null}
    </GalleryTile>
  );
}

export interface SavedAudiosGalleryProps {
  audios: SavedAudioRef[];
  onReorder: (next: SavedAudioRef[]) => void | Promise<void>;
  onDelete: (audioId: string) => void;
  onTrash?: (audioId: string) => void;
  emptyLabel?: string;
  audioAltFallback?: string;
  className?: string;
  thumbScale?: GalleryThumbScale;
  /** Seedance R2V: show Ref toggle on tiles. */
  showRefRole?: boolean;
  refAudioIds?: string[];
  onToggleRef?: (audioId: string) => void;
  /** Native HTML5 drag of the audio asset id onto the generator / REF drawer. */
  enableAssetDrag?: boolean;
}

export function SavedAudiosGallery({
  audios,
  onReorder,
  onDelete,
  onTrash,
  emptyLabel = 'No saved audios',
  audioAltFallback = 'Saved audio',
  className,
  thumbScale = 'md',
  showRefRole = false,
  refAudioIds,
  onToggleRef,
  enableAssetDrag = false,
}: SavedAudiosGalleryProps) {
  const [viewerAudio, setViewerAudio] = useState<SavedAudioRef | null>(null);
  const { objectUrl, setFromBlob, clear } = useObjectUrl();
  const items = audios.map((audio) => audioToItem(audio, audioAltFallback));
  const metaById = new Map(audios.map((audio) => [audio.id, audioMeta(audio)]));
  const refIdSet = new Set(refAudioIds ?? []);

  const openViewer = (item: GalleryItem) => {
    const audio = audios.find((entry) => entry.id === item.id);
    if (!audio) {
      return;
    }
    setViewerAudio(audio);
    void loadAudio(audio.path)
      .then((blob) => {
        setFromBlob(blob);
      })
      .catch(() => {
        setViewerAudio(null);
        clear();
      });
  };

  const closeViewer = () => {
    setViewerAudio(null);
    clear();
  };

  return (
    <>
      <Gallery
        items={items}
        emptyLabel={emptyLabel}
        label="Saved audios"
        className={className}
        onReorder={(orderedIds) => {
          const byId = new Map(audios.map((audio) => [audio.id, audio]));
          onReorder(orderedIds.flatMap((id) => byId.get(id) ?? []));
        }}
        renderTile={({ item, sortable }) => (
          <SortableSavedAudio
            item={item}
            meta={metaById.get(item.id) ?? ''}
            sortable={sortable}
            onDelete={onDelete}
            onTrash={onTrash}
            onOpen={openViewer}
            thumbScale={thumbScale}
            isRef={refIdSet.has(item.id)}
            showRefRole={showRefRole}
            onToggleRef={onToggleRef}
            enableAssetDrag={enableAssetDrag}
          />
        )}
      />
      {viewerAudio ? (
        <AudioViewer
          src={objectUrl}
          mimeType={viewerAudio.mimeType}
          alt={audioAlt(viewerAudio, audioAltFallback)}
          durationMs={viewerAudio.metadata?.durationMs}
          onClose={closeViewer}
        />
      ) : null}
    </>
  );
}
