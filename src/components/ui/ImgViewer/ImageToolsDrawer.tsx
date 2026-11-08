import { useEffect, useState, type MouseEvent, type PointerEvent } from 'react';
import { Button } from '../Button/Button';
import type { IconName } from '../Icon/icons';
import { IconButton } from '../IconButton/IconButton';
import styles from './ImageToolsDrawer.module.css';

export type ImageToolId = 'crop' | 'resize' | 'rotate' | 'adjust';

const TOOLS: ReadonlyArray<{ id: ImageToolId; icon: IconName; label: string }> = [
  { id: 'resize', icon: 'thumb-md', label: 'Resize tool' },
  { id: 'crop', icon: 'crop', label: 'Crop' },
  { id: 'rotate', icon: 'rotate', label: 'Rotate' },
  { id: 'adjust', icon: 'mutate', label: 'Adjust' },
];

function stopBubble(event: MouseEvent | PointerEvent) {
  event.stopPropagation();
}

function parsePositiveInt(raw: string): number | null {
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value);
}

export interface ImageToolsDrawerProps {
  /** Current working-copy pixel width (hydrates resize fields). */
  imageWidth: number | null;
  /** Current working-copy pixel height (hydrates resize fields). */
  imageHeight: number | null;
  /** When true, Copy/Update can write to the asset library. */
  canPersist: boolean;
  /** Working copy differs from the opened original. */
  dirty?: boolean;
  busy?: boolean;
  /** Apply resize to the in-viewer working copy (does not touch the asset). */
  onApplyResize: (width: number, height: number) => void | Promise<void>;
  /** Restore working copy from the original opened blob. */
  onReset: () => void;
  /** Persist working copy as a new library asset. */
  onSaveCopy: () => void | Promise<void>;
  /** Persist working copy over the opened asset. */
  onSaveUpdate: () => void | Promise<void>;
}

/**
 * Left-mounted image tools chrome for the fullscreen viewer.
 * Tools edit a working copy in the viewer; Save commits Copy / Update to the library.
 */
export function ImageToolsDrawer({
  imageWidth,
  imageHeight,
  canPersist,
  dirty = false,
  busy = false,
  onApplyResize,
  onReset,
  onSaveCopy,
  onSaveUpdate,
}: ImageToolsDrawerProps) {
  const [tool, setTool] = useState<ImageToolId | null>('resize');
  const [saveMode, setSaveMode] = useState(false);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [angle, setAngle] = useState('0');
  const [brightness, setBrightness] = useState('0');
  const [contrast, setContrast] = useState('0');
  const [saturation, setSaturation] = useState('0');

  useEffect(() => {
    if (busy || saveMode) {
      return;
    }
    if (
      typeof imageWidth === 'number' &&
      imageWidth > 0 &&
      typeof imageHeight === 'number' &&
      imageHeight > 0
    ) {
      setWidth(String(imageWidth));
      setHeight(String(imageHeight));
      setAspectRatio(imageWidth / imageHeight);
    }
  }, [busy, imageHeight, imageWidth, saveMode]);

  const showToolPanel =
    !saveMode && (tool === 'resize' || tool === 'rotate' || tool === 'adjust');
  const parsedSize = (() => {
    const nextWidth = parsePositiveInt(width);
    const nextHeight = parsePositiveInt(height);
    if (nextWidth === null || nextHeight === null) {
      return null;
    }
    return { width: nextWidth, height: nextHeight };
  })();

  const setWidthLocked = (raw: string) => {
    setWidth(raw);
    if (!lockAspect) {
      return;
    }
    const nextWidth = parsePositiveInt(raw);
    if (nextWidth === null || !(aspectRatio > 0)) {
      return;
    }
    setHeight(String(Math.max(1, Math.round(nextWidth / aspectRatio))));
  };

  const setHeightLocked = (raw: string) => {
    setHeight(raw);
    if (!lockAspect) {
      return;
    }
    const nextHeight = parsePositiveInt(raw);
    if (nextHeight === null || !(aspectRatio > 0)) {
      return;
    }
    setWidth(String(Math.max(1, Math.round(nextHeight * aspectRatio))));
  };

  const selectTool = (id: ImageToolId) => {
    if (busy) {
      return;
    }
    setSaveMode(false);
    setTool((current) => (current === id ? null : id));
  };

  return (
    <aside
      className={styles.drawer}
      aria-label="Image tools"
      onClick={stopBubble}
      onPointerDown={stopBubble}
    >
      <div className={styles.rail} role="toolbar" aria-label="Edit tools">
        {TOOLS.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            variant="secondary"
            size="md"
            current={!saveMode && tool === item.id}
            disabled={busy}
            onClick={() => selectTool(item.id)}
          />
        ))}
        <IconButton
          icon="reset"
          label="Reset edits"
          variant="secondary"
          size="md"
          disabled={busy || !dirty}
          onClick={() => {
            setSaveMode(false);
            onReset();
          }}
        />
        <IconButton
          icon="save"
          label="Save edits"
          variant="success"
          size="md"
          current={saveMode}
          disabled={busy || !dirty}
          onClick={() => {
            if (!dirty) {
              return;
            }
            setSaveMode(true);
            setTool(null);
          }}
        />
      </div>

      {saveMode ? (
        <div className={styles.panel} role="region" aria-label="Save options">
          <div
            className={styles.actions}
            onClick={stopBubble}
            onPointerDown={stopBubble}
            onMouseDown={stopBubble}
          >
            <Button
              variant="secondary"
              disabled={busy}
              onClick={(event) => {
                stopBubble(event);
                setSaveMode(false);
                setTool('resize');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !canPersist}
              onClick={(event) => {
                stopBubble(event);
                void onSaveCopy();
              }}
            >
              Copy
            </Button>
            <Button
              variant="primary"
              disabled={busy || !canPersist}
              onClick={(event) => {
                stopBubble(event);
                void onSaveUpdate();
              }}
            >
              Update
            </Button>
          </div>
        </div>
      ) : null}

      {showToolPanel && tool ? (
        <div className={styles.panel} role="region" aria-label={`${tool} options`}>
          {tool === 'resize' ? (
            <>
              <div className={styles.section}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Width</span>
                  <input
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    aria-label="Width"
                    value={width}
                    disabled={busy}
                    onChange={(event) => setWidthLocked(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Height</span>
                  <input
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    aria-label="Height"
                    value={height}
                    disabled={busy}
                    onChange={(event) => setHeightLocked(event.target.value)}
                  />
                </label>
              </div>
              <div className={styles.section}>
                <IconButton
                  icon={lockAspect ? 'lock' : 'unlock'}
                  label={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  variant="secondary"
                  size="sm"
                  current={lockAspect}
                  disabled={busy}
                  onClick={() => setLockAspect((value) => !value)}
                />
              </div>
              <div
                className={styles.actions}
                onClick={stopBubble}
                onPointerDown={stopBubble}
                onMouseDown={stopBubble}
              >
                <Button
                  variant="primary"
                  disabled={busy || !parsedSize}
                  onClick={(event) => {
                    stopBubble(event);
                    if (!parsedSize) {
                      return;
                    }
                    void onApplyResize(parsedSize.width, parsedSize.height);
                  }}
                >
                  Apply
                </Button>
              </div>
            </>
          ) : null}

          {tool === 'rotate' ? (
            <div className={styles.section}>
              <div className={styles.buttonRow}>
                <IconButton
                  icon="rotate"
                  label="Rotate 90°"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setAngle((value) => String(((Number(value) || 0) + 90) % 360))
                  }
                />
              </div>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Angle</span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  aria-label="Rotation angle"
                  value={angle}
                  onChange={(event) => setAngle(event.target.value)}
                />
              </label>
            </div>
          ) : null}

          {tool === 'adjust' ? (
            <div className={styles.section}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Brightness</span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  aria-label="Brightness"
                  value={brightness}
                  onChange={(event) => setBrightness(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Contrast</span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  aria-label="Contrast"
                  value={contrast}
                  onChange={(event) => setContrast(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Saturation</span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  aria-label="Saturation"
                  value={saturation}
                  onChange={(event) => setSaturation(event.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
