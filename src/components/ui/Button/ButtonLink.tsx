import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

export interface ButtonLinkProps extends LinkProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  current?: boolean;
}

export function ButtonLink({
  children,
  variant = 'primary',
  className,
  current = false,
  to,
  ...rest
}: ButtonLinkProps) {
  const variantClass = variant === 'secondary' ? styles.secondary : styles.primary;
  const classes = [styles.button, variantClass, className].filter(Boolean).join(' ');

  if (current) {
    return (
      <span
        className={[styles.button, styles.primary, styles.current, className]
          .filter(Boolean)
          .join(' ')}
        aria-current="page"
      >
        <span className={styles.label}>{children}</span>
      </span>
    );
  }

  return (
    <Link to={to} className={classes} {...rest}>
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
