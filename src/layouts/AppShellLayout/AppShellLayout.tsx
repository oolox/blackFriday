import { Outlet } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader/AppHeader';
import { GAME_TITLE } from '../../features/game/constants';
import { SandboxSessionProvider } from '../../features/sandbox/sandboxSession';
import styles from './AppShellLayout.module.css';

export function AppShellLayout() {
  return (
    <SandboxSessionProvider>
      <div className={styles.shell}>
        <AppHeader title={GAME_TITLE} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </SandboxSessionProvider>
  );
}
