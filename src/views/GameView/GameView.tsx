import { SubHeader } from '../../components/ui/SubHeader';
import { GAME_TITLE } from '../../features/game/constants';
import styles from './GameView.module.css';

export function GameView() {
  return (
    <section className={styles.pane} aria-label="Game">
      <SubHeader>Game</SubHeader>
      <div className={styles.body}>
        <h1>{GAME_TITLE}</h1>
        <p>The shop floor is ready for the new game.</p>
      </div>
    </section>
  );
}
