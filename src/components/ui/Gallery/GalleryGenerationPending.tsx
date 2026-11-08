import { ImgContainer } from '../ImgContainer/ImgContainer';
import type { ImgContainerSize } from '../ImgContainer/imgContainerSizes';
import { IMG_CONTAINER_SIZES } from '../ImgContainer/imgContainerSizes';
import { Spinner } from '../Spinner/Spinner';
import styles from './GalleryGenerationPending.module.css';

export interface GalleryGenerationPendingProps {
  kind: 'image' | 'video';
  /** ImgContainer size id (defaults: image `md`, video `mdWide`). */
  size?: ImgContainerSize;
  statusLabel?: string;
  className?: string;
}

/** In-gallery generation loader — shown only while a generate job is in flight. */
export function GalleryGenerationPending({
  kind,
  size = kind === 'video' ? 'mdWide' : 'md',
  statusLabel = 'Generating…',
  className,
}: GalleryGenerationPendingProps) {
  const box = IMG_CONTAINER_SIZES[size];
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" aria-live="polite" aria-label={statusLabel}>
      <ImgContainer size={size} width={box.width} height={box.height} label={statusLabel}>
        <div className={styles.state}>
          <Spinner size={48} label="" />
          <span className={styles.statusText}>{statusLabel}</span>
        </div>
      </ImgContainer>
    </div>
  );
}
