import type { RefObject } from 'react';
import { IconButton } from '../IconButton/IconButton';
import type { GalleryThumbScale } from '../ImgContainer/aspectPreviewSizes';
import { SubSubHeader } from '../SubSubHeader';
import styles from './GalleryUploadHeader.module.css';

export interface GalleryUploadHeaderProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: FileList | null) => void;
  accept: string;
  uploadLabel: string;
  uploadDisabled?: boolean;
  thumbScale: GalleryThumbScale;
  onToggleThumbScale: () => void;
}

/**
 * Shared gallery header: upload button (opens a hidden file input) + thumbnail
 * size toggle, in the same SubSubHeader chrome as library Assets.
 */
export function GalleryUploadHeader({
  fileInputRef,
  onFilesSelected,
  accept,
  uploadLabel,
  uploadDisabled = false,
  thumbScale,
  onToggleThumbScale,
}: GalleryUploadHeaderProps) {
  return (
    <SubSubHeader
      navLabel="Gallery actions"
      nav={
        <>
          <IconButton
            icon="plus"
            label={uploadLabel}
            variant="secondary"
            size="sm"
            disabled={uploadDisabled}
            onClick={() => fileInputRef.current?.click()}
          />
          <IconButton
            icon={thumbScale === 'md' ? 'thumb-md' : 'thumb-sm'}
            label={thumbScale === 'md' ? 'Use small thumbnails' : 'Use medium thumbnails'}
            variant="secondary"
            size="sm"
            onClick={onToggleThumbScale}
          />
          <input
            ref={fileInputRef as RefObject<HTMLInputElement>}
            type="file"
            accept={accept}
            multiple
            className={styles.fileInput}
            onChange={(event) => {
              onFilesSelected(event.target.files);
            }}
          />
        </>
      }
    />
  );
}
