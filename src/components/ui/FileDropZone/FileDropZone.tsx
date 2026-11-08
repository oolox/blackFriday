import type { ReactNode } from 'react';
import styles from './FileDropZone.module.css';
import { useFileDropZone } from './useFileDropZone';

export interface FileDropZoneProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Same format as `<input accept>`. */
  accept?: string;
  onFiles: (files: File[]) => void;
  /** Called when a LuxNova asset id is dropped from the library. */
  onAssetIds?: (assetIds: string[]) => void;
  /** Overlay copy while a filesystem / asset drag is over the zone. */
  label?: string;
}

/**
 * Filesystem + LuxNova asset-library drop target with an optional “drop here” mask.
 * Does not handle in-app sortable DnD — only file / asset payloads.
 */
export function FileDropZone({
  children,
  className,
  disabled = false,
  accept,
  onFiles,
  onAssetIds,
  label = 'Drop Files Here',
}: FileDropZoneProps) {
  const { isDragging, dropProps } = useFileDropZone({
    disabled,
    accept,
    onFiles,
    onAssetIds,
  });
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...dropProps}>
      {children}
      {isDragging ? (
        <div className={styles.mask} aria-hidden="true">
          <p className={styles.maskLabel}>{label}</p>
        </div>
      ) : null}
    </div>
  );
}
