import type { ReactNode } from 'react';
import styles from './ButtonStrip.module.css';

export interface ButtonStripProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function ButtonStrip({
  children,
  className,
  'aria-label': ariaLabel,
}: ButtonStripProps) {
  const classes = [styles.strip, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
