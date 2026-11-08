import type { PointerEvent, ReactNode } from 'react';
import styles from './RotatableButtonBar.module.css';

/**
 * Screen-aligned control bar for rotatable hosts (map tiles).
 * Inverse-rotates and inverse-scales so buttons stay upright and constant size.
 */
export interface RotatableButtonBarProps {
  children: ReactNode;
  className?: string;
  /** Host zoom (1 = 100%). */
  zoom?: number;
  /** Host rotation in degrees clockwise. */
  rotation?: number;
  'aria-label'?: string;
}

export function RotatableButtonBar({
  children,
  className,
  zoom = 1,
  rotation = 0,
  'aria-label': ariaLabel = 'Tile actions',
}: RotatableButtonBarProps) {
  const scale = 1 / Math.max(zoom > 0 ? zoom : 1, 0.1);
  const turn = Number.isFinite(rotation) ? rotation : 0;
  const classes = [styles.bar, className].filter(Boolean).join(' ');

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className={classes}
      role="toolbar"
      aria-label={ariaLabel}
      style={{
        transform: `translate(-50%, -50%) rotate(${-turn}deg) scale(${scale})`,
      }}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  );
}
