import type { InputHTMLAttributes, MouseEvent } from 'react';
import type { IconName } from '../Icon/icons';
import { IconButton } from '../IconButton/IconButton';
import pillStyles from '../paramPill.module.css';
import styles from './ButtonDrawer.module.css';

export interface ButtonDrawerButton {
  key: string;
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  current?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export interface ButtonDrawerProps {
  icon: IconName;
  iconLabel: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  input: InputHTMLAttributes<HTMLInputElement>;
  buttons: ButtonDrawerButton[];
}

/** Icon + text field + trailing icon buttons, styled like seed / guidance / steps. */
export function ButtonDrawer({
  icon,
  iconLabel,
  label,
  open,
  onToggle,
  disabled = false,
  className,
  input,
  buttons,
}: ButtonDrawerProps) {
  const classes = [styles.bar, open ? styles.open : '', className].filter(Boolean).join(' ');
  const { className: inputClassName, disabled: inputDisabled, ...inputRest } = input;
  const inputClasses = [
    styles.input,
    inputDisabled ? pillStyles.closed : '',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const toggle = () => {
    if (!disabled) {
      onToggle();
    }
  };

  const handleButtonClick = (event: MouseEvent<HTMLButtonElement>, onClick: () => void) => {
    event.stopPropagation();
    onClick();
  };

  const handleInputClick = (event: MouseEvent<HTMLInputElement>) => {
    if (!inputDisabled) {
      event.stopPropagation();
    }
  };

  return (
    <div className={classes} role="group" aria-label={label} onClick={toggle}>
      <IconButton
        icon={icon}
        label={iconLabel}
        variant="secondary"
        size="xs"
        aria-expanded={open}
        disabled={disabled}
      />
      <div className={styles.row}>
        <input
          type="text"
          {...inputRest}
          className={inputClasses}
          disabled={inputDisabled}
          onClick={handleInputClick}
        />
        {buttons.map((button) => (
          <IconButton
            key={button.key}
            icon={button.icon}
            label={button.label}
            variant={button.variant ?? 'secondary'}
            size="xs"
            current={button.current}
            disabled={button.disabled}
            onClick={(event) => handleButtonClick(event, button.onClick)}
          />
        ))}
      </div>
    </div>
  );
}
