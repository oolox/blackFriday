import { NavLink } from 'react-router-dom';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.title}>{title}</p>
      <nav className={styles.nav} aria-label="View navigation">
        <NavLink to="/" end>
          Play
        </NavLink>
      </nav>
    </header>
  );
}
