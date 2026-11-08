import type { ButtonHTMLAttributes } from 'react';
import { IconButton } from '../IconButton/IconButton';
import type { IconName } from '../Icon/icons';

export type ButtonToggleValue = number;

/** Toggle button cycling icon/label pairs; `labels` are accessible names for each state (active state shown). */
export interface ButtonToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  icons: IconName[];
  labels: string[];
  value: ButtonToggleValue;
  onChange: (value: ButtonToggleValue) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export function ButtonToggle({
  icons,
  labels,
  value,
  onChange,
  variant = 'secondary',
  size = 'md',
  disabled,
  type = 'button',
  onClick,
  ...rest
}: ButtonToggleProps) {
  const count = Math.min(icons.length, labels.length);
  const safeValue = count > 0 ? ((value % count) + count) % count : 0;
  const nextValue = count > 0 ? (safeValue + 1) % count : 0;

  return (
    <IconButton
      type={type}
      icon={icons[safeValue]!}
      label={labels[safeValue]!}
      variant={variant}
      size={size}
      disabled={disabled}
      aria-pressed={count === 2 ? safeValue === 1 : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && count > 0) {
          onChange(nextValue);
        }
      }}
      {...rest}
    />
  );
}
