import { useEffect, useState, type KeyboardEvent } from 'react';
import { ButtonDrawer, type ButtonDrawerButton } from '../ButtonDrawer';
import type { IconName } from '../Icon/icons';

/** Numeric param pill; `label` is the accessible group/options stem; `step` adds ± while open; `defaultValue` adds reset. */
export interface NumericParamBarProps {
  icon: IconName;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  inputMode?: 'numeric' | 'decimal';
  formatDisplay?: (value: number) => string;
  isValid: (value: number) => boolean;
  parse?: (raw: string) => number;
  step?: number;
  min?: number;
  max?: number;
  defaultValue?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) {
    next = Math.max(min, next);
  }
  if (max !== undefined) {
    next = Math.min(max, next);
  }
  return next;
}

function nudge(value: number, delta: number): number {
  const decimals = delta.toString().includes('.')
    ? (delta.toString().split('.')[1]?.length ?? 0)
    : 0;
  const factor = 10 ** decimals;
  return Math.round((value + delta) * factor) / factor;
}

export function NumericParamBar({
  icon,
  label,
  value,
  onChange,
  disabled = false,
  className,
  inputMode = 'numeric',
  formatDisplay = String,
  isValid,
  parse = Number,
  step,
  min,
  max,
  defaultValue,
  open: openProp,
  onOpenChange,
}: NumericParamBarProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const [draft, setDraft] = useState(formatDisplay(value));
  const inputDisabled = disabled || !open;
  const displayValue = open ? draft : formatDisplay(value);

  useEffect(() => {
    setDraft(formatDisplay(value));
  }, [formatDisplay, value]);

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  const toggle = () => {
    if (disabled) {
      return;
    }
    setOpen(!open);
  };

  const commitValue = (next: number) => {
    const clamped = clamp(next, min, max);
    if (!isValid(clamped)) {
      setDraft(formatDisplay(value));
      return;
    }
    setDraft(formatDisplay(clamped));
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  const submitDraft = () => {
    const next = parse(draft.trim());
    if (!Number.isFinite(next)) {
      setDraft(formatDisplay(value));
      return;
    }
    commitValue(next);
  };

  const adjust = (direction: 1 | -1) => {
    if (disabled || step === undefined) {
      return;
    }
    commitValue(nudge(value, direction * step));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitDraft();
    }
  };

  const buttons: ButtonDrawerButton[] = [];
  if (open && step !== undefined) {
    buttons.push({
      key: 'decrease',
      icon: 'caret-left',
      label: `Decrease ${label}`,
      disabled: disabled || (min !== undefined && value <= min),
      onClick: () => adjust(-1),
    });
  }
  if (open && step !== undefined) {
    buttons.push({
      key: 'increase',
      icon: 'caret-right',
      label: `Increase ${label}`,
      disabled: disabled || (max !== undefined && value >= max),
      onClick: () => adjust(1),
    });
  }
  if (open && defaultValue !== undefined) {
    buttons.push({
      key: 'reset',
      icon: 'reset',
      label: `Reset ${label}`,
      disabled: disabled || value === defaultValue,
      onClick: () => commitValue(defaultValue),
    });
  }

  return (
    <ButtonDrawer
      icon={icon}
      iconLabel={`${label} options`}
      label={label}
      open={open}
      onToggle={toggle}
      disabled={disabled}
      className={className}
      input={{
        inputMode,
        'aria-label': label,
        title: formatDisplay(value),
        size: inputDisabled ? 4 : Math.max(displayValue.length, 1),
        value: displayValue,
        disabled: inputDisabled,
        onChange: (event) => setDraft(event.target.value),
        onBlur: submitDraft,
        onKeyDown: handleKeyDown,
      }}
      buttons={buttons}
    />
  );
}
