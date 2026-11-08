import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { IconButton } from '../IconButton/IconButton';
import styles from './ColorPicker.module.css';

export const DEFAULT_COLOR_PICKER_COLOR = '#f97316';

export interface ColorPickerProps {
  color?: string;
  onChange?: (color: string) => void;
  onChangeEnd?: (color: string) => void;
  disabled?: boolean;
  /** Accessible name for the opener (GAME SubSubHeader). */
  label?: string;
  className?: string;
  /** Controlled open state (tool-toggle hosts). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * LuxNova chrome around `react-colorful`: icon toggle, token-styled panel,
 * hex field. Portals the panel so SubSubHeader overflow does not clip it.
 */
export function ColorPicker({
  color: colorProp,
  onChange,
  onChangeEnd,
  disabled = false,
  label = 'calvasPicker',
  className,
  open: openProp,
  onOpenChange,
}: ColorPickerProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(DEFAULT_COLOR_PICKER_COLOR);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const isControlled = colorProp !== undefined;
  const color = isControlled ? colorProp : uncontrolled;
  const openControlled = openProp !== undefined;
  const open = openControlled ? openProp : uncontrolledOpen;

  const setColor = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const setOpenSafe = useCallback(
    (next: boolean) => {
      if (disabled) {
        return;
      }
      if (!openControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [disabled, openControlled, onOpenChange],
  );

  const syncPanelPosition = useCallback(() => {
    const button = rootRef.current?.querySelector('button');
    if (!button) {
      return;
    }
    const rect = button.getBoundingClientRect();
    setPanelPos({ top: rect.bottom + 8, left: rect.left });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    syncPanelPosition();
    window.addEventListener('resize', syncPanelPosition);
    window.addEventListener('scroll', syncPanelPosition, true);
    return () => {
      window.removeEventListener('resize', syncPanelPosition);
      window.removeEventListener('scroll', syncPanelPosition, true);
    };
  }, [open, syncPanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenSafe(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpenSafe(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, setOpenSafe]);

  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={classes}>
      <IconButton
        icon="color-picker"
        label={label}
        variant="secondary"
        size="xs"
        current={open}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpenSafe(!open)}
      />
      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className={styles.panel}
              role="dialog"
              aria-label="Color picker"
              style={{ top: panelPos.top, left: panelPos.left }}
            >
              <HexColorPicker
                color={color}
                onChange={setColor}
                onChangeEnd={onChangeEnd}
              />
              <HexColorInput
                className={styles.hexInput}
                color={color}
                prefixed
                aria-label="Hex color"
                onChange={(next) => {
                  setColor(next);
                  onChangeEnd?.(next);
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
