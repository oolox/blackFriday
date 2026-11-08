import type { CSSProperties, ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import {
  IMG_CONTAINER_SIZES,
  type ImgContainerSize,
} from './imgContainerSizes';
import styles from './ImgContainer.module.css';

export type { ImgContainerSize } from './imgContainerSizes';

/** Fixed-aspect image frame; `size` is square / wide 16:9 / portrait 9:16; action buttons sit top-right. */
export interface ImgContainerProps {
  children: ReactNode;
  className?: string;
  size?: ImgContainerSize;
  /** When set with `height`, overrides `size` pixel box (e.g. true upload aspect). */
  width?: number;
  height?: number;
  label?: string;
  /** Remove from gallery only (X). */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  /** Remove from gallery and delete library asset (trash). */
  onTrash?: () => void | Promise<void>;
  trashLabel?: string;
  /** Optional prompt-load action (sits left of delete when both are set). */
  onLoad?: () => void | Promise<void>;
  loadLabel?: string;
  /** Optional generation-settings load (sits between prompt load and delete). */
  onLoadModel?: () => void | Promise<void>;
  loadModelLabel?: string;
}

export function ImgContainer({
  children,
  className,
  size = 'md',
  width: widthProp,
  height: heightProp,
  label,
  onDelete,
  deleteLabel = 'Remove from gallery',
  onTrash,
  trashLabel = 'Delete from library',
  onLoad,
  loadLabel = 'Load image',
  onLoadModel,
  loadModelLabel = 'Load model',
}: ImgContainerProps) {
  const fromSize = IMG_CONTAINER_SIZES[size];
  const width =
    typeof widthProp === 'number' && widthProp > 0 ? widthProp : fromSize.width;
  const height =
    typeof heightProp === 'number' && heightProp > 0 ? heightProp : fromSize.height;
  const classes = [styles.root, className].filter(Boolean).join(' ');
  const style: CSSProperties = {
    width,
    height,
    maxWidth: '100%',
  };

  const handleDelete = () => {
    if (!onDelete) {
      return;
    }
    void onDelete();
  };

  const handleTrash = () => {
    if (!onTrash) {
      return;
    }
    void onTrash();
  };

  const handleLoad = () => {
    if (!onLoad) {
      return;
    }
    void onLoad();
  };

  const handleLoadModel = () => {
    if (!onLoadModel) {
      return;
    }
    void onLoadModel();
  };

  return (
    <div className={classes} style={style} aria-label={label} data-size={size}>
      <div className={styles.content}>{children}</div>
      {onLoad || onLoadModel || onTrash || onDelete ? (
        <div className={styles.actions}>
          {onLoad ? (
            <IconButton
              className={styles.actionButton}
              icon="prompt"
              label={loadLabel}
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                handleLoad();
              }}
            />
          ) : null}
          {onLoadModel ? (
            <IconButton
              className={styles.actionButton}
              icon="model"
              label={loadModelLabel}
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                handleLoadModel();
              }}
            />
          ) : null}
          {onTrash ? (
            <IconButton
              className={styles.actionButton}
              icon="trash"
              label={trashLabel}
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                handleTrash();
              }}
            />
          ) : null}
          {onDelete ? (
            <IconButton
              className={styles.actionButton}
              icon="close"
              label={deleteLabel}
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
