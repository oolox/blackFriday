import { useEffect, useState, type KeyboardEvent } from 'react';
import { isSeed } from '../../../services/generation/seedService';
import { ButtonDrawer, type ButtonDrawerButton } from '../ButtonDrawer';

/**
 * Seed control. `createSeed` runs on refresh; `locked` keeps the seed fixed (defaults unlocked).
 * `onChange` fires on refresh or submitted edit.
 */
export interface SeedGeneratorProps {
  value: number;
  onChange: (seed: number) => void;
  disabled?: boolean;
  className?: string;
  createSeed: () => number;
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SeedGenerator({
  value,
  onChange,
  disabled = false,
  className,
  createSeed,
  locked: lockedProp,
  onLockedChange,
  open: openProp,
  onOpenChange,
}: SeedGeneratorProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const [draft, setDraft] = useState(String(value));
  const [uncontrolledLocked, setUncontrolledLocked] = useState(false);
  const locked = lockedProp ?? uncontrolledLocked;
  const inputDisabled = disabled || !open;
  const displayValue = open ? draft : String(value).slice(-4);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const setLocked = (next: boolean) => {
    if (lockedProp === undefined) {
      setUncontrolledLocked(next);
    }
    onLockedChange?.(next);
  };

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

  const refresh = () => {
    if (disabled) {
      return;
    }
    onChange(createSeed());
  };

  const toggleLock = () => {
    if (disabled) {
      return;
    }
    setLocked(!locked);
  };

  const submitDraft = () => {
    const next = Number(draft.trim());
    if (!isSeed(next)) {
      setDraft(String(value));
      return;
    }
    if (next !== value) {
      onChange(next);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitDraft();
    }
  };

  const buttons: ButtonDrawerButton[] = [];
  if (open) {
    buttons.push({
      key: 'refresh',
      icon: 'regenerate',
      label: 'Refresh seed',
      disabled,
      onClick: refresh,
    });
  }
  buttons.push({
    key: 'lock',
    icon: locked ? 'lock' : 'unlock',
    label: locked ? 'Unlock seed' : 'Lock seed',
    variant: locked ? 'primary' : 'secondary',
    current: locked,
    disabled,
    onClick: toggleLock,
  });

  return (
    <ButtonDrawer
      icon="dice"
      iconLabel="Seed options"
      label="Seed"
      open={open}
      onToggle={toggle}
      disabled={disabled}
      className={className}
      input={{
        inputMode: 'numeric',
        'aria-label': 'Seed',
        title: String(value),
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
