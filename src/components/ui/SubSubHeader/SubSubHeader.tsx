import type { ReactNode } from 'react';
import { Tabs, type TabsItem } from '../Tabs';
import styles from './SubSubHeader.module.css';

export interface SubSubHeaderProps {
  /** Controlled subtype tab id. */
  value?: string;
  items?: TabsItem[];
  onChange?: (id: string) => void;
  disabled?: boolean;
  /** Optional leading content beside the subtype tabs. */
  children?: ReactNode;
  /** Optional trailing actions (mirrors SubHeader `nav`). */
  nav?: ReactNode;
  navLabel?: string;
  tabsLabel?: string;
  className?: string;
}

/**
 * Secondary chrome under a folder subheader — subtype tabs (e.g. Image / Video / System).
 * Visual language follows {@link SubHeader}, slightly tighter for nested use.
 */
export function SubSubHeader({
  value,
  items,
  onChange,
  disabled = false,
  children,
  nav,
  navLabel = 'Actions',
  tabsLabel = 'Subtypes',
  className,
}: SubSubHeaderProps) {
  const classes = [styles.subSubHeader, className].filter(Boolean).join(' ');
  const tabs = items ?? [];

  return (
    <header className={classes} aria-label={tabs.length === 0 ? tabsLabel : undefined}>
      <div className={styles.content}>
        {children}
        {tabs.length > 0 && value != null && onChange ? (
          <Tabs
            items={tabs}
            value={value}
            disabled={disabled}
            idPrefix="subtab"
            aria-label={tabsLabel}
            onChange={onChange}
          />
        ) : null}
      </div>
      {nav ? (
        <nav className={styles.nav} aria-label={navLabel}>
          {nav}
        </nav>
      ) : null}
    </header>
  );
}
