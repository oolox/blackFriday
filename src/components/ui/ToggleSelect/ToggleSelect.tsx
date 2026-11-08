import type { ReactNode } from 'react';
import { ButtonBar, type ButtonBarItem } from '../ButtonBar';
import type { IconName } from '../Icon/icons';
import styles from './ToggleSelect.module.css';

export type ToggleSelectItem = ButtonBarItem;

/**
 * Compact icon-toggle select (collapsed circle → expanded pill with options).
 * Shared by txt2img and chat model pickers — same chrome as the generator model bar.
 */
export interface ToggleSelectProps {
  label: string;
  items: ToggleSelectItem[];
  value: string;
  onChange: (id: string) => void;
  labelIcon?: IconName;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  widgets?: ReactNode;
}

export function ToggleSelect({
  label,
  items,
  value,
  onChange,
  labelIcon = 'model',
  disabled = false,
  open,
  onOpenChange,
  className,
  widgets,
}: ToggleSelectProps) {
  const classes = [styles.toggleSelect, className].filter(Boolean).join(' ');

  return (
    <ButtonBar
      className={classes}
      label={label}
      labelIcon={labelIcon}
      defaultOpen={false}
      showSelect
      compactOptions
      items={items}
      value={value}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
      onChange={onChange}
      widgets={widgets}
    />
  );
}
