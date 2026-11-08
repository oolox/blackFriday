import { ImgContainer } from '../ImgContainer/ImgContainer';
import type { GalleryTileProps } from './galleryTypes';
import styles from './Gallery.module.css';

/** One gallery cell: optional sortable handle + ImgContainer overlays + kind chrome. */
export function GalleryTile({
  item,
  sortable,
  size = 'md',
  width,
  height,
  onDelete,
  deleteLabel = 'Remove from gallery',
  onTrash,
  trashLabel = 'Delete from library',
  onLoad,
  loadLabel = 'Load',
  onLoadModel,
  loadModelLabel = 'Load model',
  children,
  chrome,
}: GalleryTileProps) {
  const itemClass = [
    styles.item,
    sortable ? styles.itemSortable : '',
    sortable?.isDragging ? styles.itemDragging : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      ref={sortable?.setNodeRef}
      className={itemClass}
      style={sortable?.style}
      {...sortable?.attributes}
      {...sortable?.listeners}
    >
      <div className={styles.thumbWrap}>
        <ImgContainer
          size={size}
          width={width}
          height={height}
          label={item.label}
          onLoad={onLoad ? () => onLoad(item.id) : undefined}
          loadLabel={loadLabel}
          onLoadModel={onLoadModel ? () => onLoadModel(item.id) : undefined}
          loadModelLabel={loadModelLabel}
          onTrash={onTrash ? () => onTrash(item.id) : undefined}
          trashLabel={trashLabel}
          onDelete={onDelete ? () => onDelete(item.id) : undefined}
          deleteLabel={deleteLabel}
        >
          {children}
        </ImgContainer>
        {chrome}
      </div>
    </li>
  );
}
