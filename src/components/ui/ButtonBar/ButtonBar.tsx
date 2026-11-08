import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { Icon } from '../Icon/Icon';
import type { IconName } from '../Icon/icons';
import pillStyles from '../paramPill.module.css';
import { SmallButton } from '../SmallButton';
import styles from './ButtonBar.module.css';

/** Option in a button bar; `icon` is shown only while this item is active. */
export interface ButtonBarItem {
  id: string;
  label: ReactNode;
  ariaLabel?: string;
  icon?: IconName;
}

/**
 * Collapsible option bar. `label` is the accessible group name; `labelIcon` replaces text and toggles the group.
 * When collapsed, `showSelect` still shows the active option; `compactOptions` uses fixed 3ch pills;
 * `widgets` render after the buttons on the right.
 */
export interface ButtonBarProps {
  label: string;
  labelIcon?: IconName;
  items: ButtonBarItem[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showSelect?: boolean;
  compactOptions?: boolean;
  widgets?: ReactNode;
  className?: string;
}

export function ButtonBar({
  label,
  labelIcon,
  items,
  value,
  onChange,
  disabled = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  showSelect = false,
  compactOptions = false,
  widgets,
  className,
}: ButtonBarProps) {
  const buttonsId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const showButtons = open || showSelect;
  const visibleItems = open ? items : items.filter((item) => item.id === value);
  const classes = [
    styles.bar,
    open || !labelIcon || showSelect ? '' : styles.collapsed,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div className={classes}>
      {labelIcon ? (
        <button
          type="button"
          className={styles.labelButton}
          aria-label={label}
          aria-expanded={open}
          aria-controls={buttonsId}
          disabled={disabled}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <Icon name={labelIcon} className={styles.labelIcon} />
        </button>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
      {showButtons && visibleItems.length > 0 ? (
        <div id={buttonsId} className={styles.buttons} role="group" aria-label={label}>
          {visibleItems.map((item) => {
            const current = item.id === value;
            return (
              <SmallButton
                key={item.id}
                current={current}
                disabled={disabled}
                className={compactOptions ? pillStyles.closed : undefined}
                aria-label={item.ariaLabel}
                icon={current ? item.icon : undefined}
                onClick={() => {
                  if (!open) {
                    setOpen(true);
                    return;
                  }
                  onChange(item.id);
                }}
              >
                {item.label}
              </SmallButton>
            );
          })}
        </div>
      ) : null}
      {open && widgets ? <div className={styles.widgets}>{widgets}</div> : null}
    </div>
  );
}
