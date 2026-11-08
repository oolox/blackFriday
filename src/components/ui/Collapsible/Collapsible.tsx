import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Collapsible.module.css';

export interface CollapsibleProps {
  title: string;
  children: ReactNode;
  /** Controlled open state. Omit for uncontrolled. */
  open?: boolean;
  /** Uncontrolled initial open state. Default true. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Reusable header + body. Click the header or caret to collapse/expand.
 */
export function Collapsible({
  title,
  children,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  className,
}: CollapsibleProps) {
  const panelId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        onClick={() => setOpen(!open)}
      >
        <Icon
          name={open ? 'caret-down' : 'caret-right'}
          size={16}
          className={styles.caret}
        />
        <span className={styles.title}>{title}</span>
      </button>
      {open ? (
        <div id={panelId} className={styles.body}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
