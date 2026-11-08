import type { CSSProperties, ReactNode } from 'react';
import type { GalleryThumbScale } from '../ImgContainer/aspectPreviewSizes';
import type { ImgContainerSize } from '../ImgContainer/imgContainerSizes';

export type GalleryKind = 'image' | 'video' | 'text' | 'audio';

/** View-model for one gallery tile. Persistence types stay Saved*Ref. */
export interface GalleryItem {
  id: string;
  kind: GalleryKind;
  label: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
}

export interface GallerySortableApi {
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: object;
  listeners?: object;
  style: CSSProperties;
  isDragging: boolean;
}

export interface GalleryRenderTileContext {
  item: GalleryItem;
  sortable?: GallerySortableApi;
}

export interface GalleryProps {
  items: GalleryItem[];
  emptyLabel?: string;
  heading?: string;
  label?: string;
  className?: string;
  /** When set, tiles are drag-reorderable. Callback receives ids in new order. */
  onReorder?: (orderedIds: string[]) => void;
  renderTile: (ctx: GalleryRenderTileContext) => ReactNode;
}

export interface GalleryTileProps {
  item: GalleryItem;
  sortable?: GallerySortableApi;
  size?: ImgContainerSize;
  width?: number;
  height?: number;
  /** Remove from gallery only (X). */
  onDelete?: (id: string) => void;
  deleteLabel?: string;
  /** Remove from gallery and delete library asset (trash). */
  onTrash?: (id: string) => void;
  trashLabel?: string;
  onLoad?: (id: string) => void;
  loadLabel?: string;
  onLoadModel?: (id: string) => void;
  loadModelLabel?: string;
  children: ReactNode;
  chrome?: ReactNode;
}

export type { GalleryThumbScale };
