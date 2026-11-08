import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../IconButton/IconButton';
import styles from './FullScreenModal.module.css';

export interface FullScreenModalProps {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
  ariaLabel?: string;
  closeLabel?: string;
  /** When false, the backdrop, Escape, and the corner close control stay inactive. */
  dismissible?: boolean;
}

/** Reusable fullscreen modal: dimmed backdrop, top-right close, centered panel. */
export function FullScreenModal({
  open,
  onClose,
  children = 'Placeholder',
  ariaLabel = 'Modal',
  closeLabel = 'Close modal',
  dismissible = true,
}: FullScreenModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (dismissible && event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dismissible, open, onClose]);

  if (!open) {
    return null;
  }

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={() => {
        if (dismissible) {
          onClose();
        }
      }}
    >
      {dismissible ? (
        <IconButton
          className={styles.close}
          icon="close"
          label={closeLabel}
          variant="secondary"
          size="md"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        />
      ) : null}
      <div className={styles.center}>
        <div className={styles.panel} onClick={stopPropagation}>
          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
