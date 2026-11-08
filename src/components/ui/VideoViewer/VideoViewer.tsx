import { MediaViewerOverlay } from '../MediaViewerOverlay/MediaViewerOverlay';
import styles from './VideoViewer.module.css';

export interface VideoViewerProps {
  /** Object URL for the full video blob; `null` while it's still loading. */
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * Fullscreen video viewer — same masked/centered overlay as `ImgViewer`
 * (via `MediaViewerOverlay`), but renders the video at its native resolution
 * (no forced upscale) using the same `<video controls playsInline>` element
 * the VID generator preview uses.
 */
export function VideoViewer({ src, alt = '', onClose }: VideoViewerProps) {
  return (
    <MediaViewerOverlay alt={alt} closeLabel="Close video" onClose={onClose}>
      {src ? (
        <video
          className={styles.video}
          src={src}
          controls
          playsInline
          aria-label={alt}
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <p className={styles.loading}>Loading video…</p>
      )}
    </MediaViewerOverlay>
  );
}
