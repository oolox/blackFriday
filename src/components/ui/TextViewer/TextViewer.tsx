import { MarkdownContent } from '../../markdown/MarkdownContent/MarkdownContent';
import { MediaViewerOverlay } from '../MediaViewerOverlay/MediaViewerOverlay';
import styles from './TextViewer.module.css';

export interface TextViewerProps {
  /** Full text content; `null` while it's still loading. */
  content: string | null;
  /** `text/markdown` renders via `MarkdownContent`; `text/plain` renders as preformatted text. */
  mimeType: 'text/plain' | 'text/markdown';
  alt?: string;
  onClose: () => void;
}

/**
 * Fullscreen text/markdown viewer — same masked/centered overlay as
 * `ImgViewer` / `VideoViewer` (via `MediaViewerOverlay`), scrollable panel.
 */
export function TextViewer({ content, mimeType, alt = '', onClose }: TextViewerProps) {
  return (
    <MediaViewerOverlay alt={alt} closeLabel="Close text" onClose={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        {content == null ? (
          <p className={styles.loading}>Loading text…</p>
        ) : mimeType === 'text/markdown' ? (
          <MarkdownContent content={content} className={styles.markdown} />
        ) : (
          <pre className={styles.plain}>{content}</pre>
        )}
      </div>
    </MediaViewerOverlay>
  );
}
