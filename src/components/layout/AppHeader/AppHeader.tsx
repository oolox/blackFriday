import { useState } from 'react';
import { useSandboxSession } from '../../../features/sandbox/sandboxSessionContext';
import { Button } from '../../ui/Button/Button';
import { Tabs } from '../../ui/Tabs';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  title: string;
}

type PlayMode = 'sandbox' | 'game';

export function AppHeader({ title }: AppHeaderProps) {
  const [mode, setMode] = useState<PlayMode>('sandbox');
  const { requestNew } = useSandboxSession();

  return (
    <header className={styles.header}>
      <p className={styles.title}>{title}</p>
      <div className={styles.actions}>
        <Tabs
          aria-label="Mode"
          idPrefix="mode"
          items={[
            { id: 'sandbox', label: 'Sandbox' },
            { id: 'game', label: 'Game', disabled: true },
          ]}
          value={mode}
          onChange={(id) => {
            if (id === 'sandbox' && mode !== 'sandbox') {
              setMode('sandbox');
              requestNew();
            }
          }}
        />
        <Button variant="tab" onClick={requestNew}>
          New
        </Button>
      </div>
    </header>
  );
}
