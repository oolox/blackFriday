import styles from './assetPlaceholder.module.css';
import { TilesList } from './TilesList/TilesList';

export function TilesPlaceholder() {
  return (
    <div className={styles.view}>
      <TilesList />
    </div>
  );
}
