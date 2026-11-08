import { useState } from 'react';
import { loadTextContent } from '../../../services/storage/textStorage';
import type { SavedTextRef } from '../../../types/savedText';
import { Gallery, GalleryTile, type GalleryItem, type GallerySortableApi } from '../Gallery';
import { Icon } from '../Icon/Icon';
import type { GalleryThumbScale } from '../ImgContainer/aspectPreviewSizes';
import { IMG_CONTAINER_SIZES } from '../ImgContainer/imgContainerSizes';
import { TextViewer } from '../TextViewer';
import styles from './SavedTextsGallery.module.css';

function textAlt(text: SavedTextRef, fallback: string): string {
  return text.metadata?.originalName || fallback;
}

function textToItem(text: SavedTextRef, fallback: string): GalleryItem {
  return {
    id: text.id,
    kind: 'text',
    label: textAlt(text, fallback),
  };
}

function SortableSavedText({
  item,
  sortable,
  onDelete,
  onTrash,
  onOpen,
  thumbScale,
}: {
  item: GalleryItem;
  sortable?: GallerySortableApi;
  onDelete: (textId: string) => void;
  onTrash?: (textId: string) => void;
  onOpen: (item: GalleryItem) => void;
  thumbScale: GalleryThumbScale;
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
      trashLabel="Delete text from library"
      onDelete={onDelete}
      deleteLabel="Remove text from gallery"
    >
      <span
        className={styles.cardInner}
        onClick={(event) => {
          event.stopPropagation();
          onOpen(item);
        }}
      >
        <Icon name="text-file" size={thumbScale === 'md' ? 40 : 24} />
        <span className={styles.cardLabel}>{item.label}</span>
      </span>
    </GalleryTile>
  );
}

export interface SavedTextsGalleryProps {
  texts: SavedTextRef[];
  onReorder: (next: SavedTextRef[]) => void | Promise<void>;
  /** Remove from gallery only (X). */
  onDelete: (textId: string) => void;
  /** Remove from gallery and delete library asset (trash). */
  onTrash?: (textId: string) => void;
  emptyLabel?: string;
  textAltFallback?: string;
  className?: string;
  thumbScale?: GalleryThumbScale;
}

export function SavedTextsGallery({
  texts,
  onReorder,
  onDelete,
  onTrash,
  emptyLabel = 'No saved texts',
  textAltFallback = 'Saved text',
  className,
  thumbScale = 'md',
}: SavedTextsGalleryProps) {
  const [viewer, setViewer] = useState<{ text: SavedTextRef; content: string | null } | null>(
    null,
  );
  const items = texts.map((text) => textToItem(text, textAltFallback));

  const openViewer = (item: GalleryItem) => {
    const text = texts.find((entry) => entry.id === item.id);
    if (!text) {
      return;
    }
    setViewer({ text, content: null });
    void loadTextContent(text.path || text.id)
      .then((content) => {
        setViewer((current) => (current?.text.id === text.id ? { text, content } : current));
      })
      .catch(() => {
        setViewer((current) => (current?.text.id === text.id ? null : current));
      });
  };

  return (
    <>
      <Gallery
        items={items}
        emptyLabel={emptyLabel}
        label="Saved texts"
        className={className}
        onReorder={(orderedIds) => {
          const byId = new Map(texts.map((text) => [text.id, text]));
          onReorder(orderedIds.flatMap((id) => byId.get(id) ?? []));
        }}
        renderTile={({ item, sortable }) => (
          <SortableSavedText
            item={item}
            sortable={sortable}
            onDelete={onDelete}
            onTrash={onTrash}
            onOpen={openViewer}
            thumbScale={thumbScale}
          />
        )}
      />
      {viewer ? (
        <TextViewer
          content={viewer.content}
          mimeType={viewer.text.mimeType}
          alt={textAlt(viewer.text, textAltFallback)}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </>
  );
}
