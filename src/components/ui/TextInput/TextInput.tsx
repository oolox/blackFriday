import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './TextInput.module.css';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelAdornment?: ReactNode;
}

export function TextInput({ label, labelAdornment, id, className, ...rest }: TextInputProps) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const classes = [styles.input, className].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        {labelAdornment}
      </div>
      <input id={inputId} className={classes} {...rest} />
    </div>
  );
}
