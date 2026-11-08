import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../IconButton/IconButton';
import styles from './MediaViewerOverlay.module.css';

export interface MediaViewerOverlayProps {
  alt?: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  /**
   * Chrome rendered above the media frame (e.g. image tools).
   * Kept outside the frame click-to-close target so control clicks never dismiss the viewer.
   */
  toolbar?: ReactNode;
}

function stopBubble(event: MouseEvent) {
  event.stopPropagation();
}

/**
 * Shared fullscreen chrome for `ImgViewer` / `VideoViewer`: masked backdrop,
 * centered frame, Escape-to-close, body-scroll lock, and the hover-reveal
 * close button. Callers supply only the media element (`<img>` / `<video>`).
 */
export function MediaViewerOverlay({
  alt = '',
  closeLabel,
  onClose,
  children,
  toolbar,
}: MediaViewerOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const closeFrom = (event: MouseEvent) => {
    event.stopPropagation();
    onClose();
  };

  return createPortal(
    <div
      className={styles.mask}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Media viewer'}
      onClick={onClose}
    >
      {toolbar ? (
        <div
          className={styles.toolbarSlot}
          onClick={stopBubble}
          onPointerDown={stopBubble}
          onMouseDown={stopBubble}
        >
          {toolbar}
        </div>
      ) : null}
      {/* Frame fills the mask; click empty/letterbox area closes (same as mask). */}
      <div className={styles.frame} onClick={closeFrom}>
        <div className={styles.wrap}>
          {children}
          <IconButton
            className={styles.close}
            icon="close"
            label={closeLabel}
            variant="secondary"
            size="md"
            onClick={closeFrom}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
