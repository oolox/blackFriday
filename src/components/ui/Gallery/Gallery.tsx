import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Fragment } from 'react';
import type { GalleryProps, GallerySortableApi } from './galleryTypes';
import styles from './Gallery.module.css';

function SortableTile({
  id,
  children,
}: {
  id: string;
  children: (sortable: GallerySortableApi) => ReturnType<GalleryProps['renderTile']>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const sortable: GallerySortableApi = {
    setNodeRef,
    attributes,
    listeners,
    style: {
      transform: CSS.Transform.toString(transform),
      transition,
    },
    isDragging,
  };
  return children(sortable);
}

/**
 * Presentational gallery grid. Hosts supply tiles (image / video / text).
 * Pass `onReorder` to enable drag-and-drop; omit it for a static strip.
 */
export function Gallery({
  items,
  emptyLabel = 'No saved items',
  heading,
  label = 'Saved items',
  className,
  onReorder,
  renderTile,
}: GalleryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const classes = [styles.root, className].filter(Boolean).join(' ');

  if (items.length === 0) {
    return (
      <div className={classes} aria-label={label}>
        <p className={styles.empty}>{emptyLabel}</p>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onReorder) {
      return;
    }
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onReorder(arrayMove(items, oldIndex, newIndex).map((item) => item.id));
  };

  const list = (
    <ul className={styles.list}>
      {items.map((item) =>
        onReorder ? (
          <SortableTile key={item.id} id={item.id}>
            {(sortable) => renderTile({ item, sortable })}
          </SortableTile>
        ) : (
          <Fragment key={item.id}>{renderTile({ item })}</Fragment>
        ),
      )}
    </ul>
  );

  return (
    <div className={classes} aria-label={label}>
      {heading ? <p className={styles.heading}>{heading}</p> : null}
      {onReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
            {list}
          </SortableContext>
        </DndContext>
      ) : (
        list
      )}
    </div>
  );
}
