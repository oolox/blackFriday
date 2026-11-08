import { useState } from 'react';
import { Checkbox } from '../../components/ui/Checkbox';
import { SubHeader } from '../../components/ui/SubHeader';
import { GAME_TITLE } from '../../features/game/constants';
import { useSandboxSession } from '../../features/sandbox/sandboxSessionContext';
import styles from './GameView.module.css';
import { MapCanvas } from './MapCanvas';

export function GameView() {
  const [showRooms, setShowRooms] = useState(false);
  const { map } = useSandboxSession();

  return (
    <section className={styles.pane} aria-label="Game">
      <SubHeader
        nav={
          <Checkbox
            label="Rooms"
            checked={showRooms}
            onChange={(event) => setShowRooms(event.target.checked)}
          />
        }
        navLabel="Map overlays"
      >
        <h1 className={styles.title}>{GAME_TITLE}</h1>
      </SubHeader>
      <div className={styles.body}>
        {map ? <MapCanvas key={map.seed} map={map} showRooms={showRooms} /> : null}
      </div>
    </section>
  );
}
