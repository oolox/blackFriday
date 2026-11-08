import { SubSubHeader } from '../../../../components/ui/SubSubHeader';
import { tiles } from '../../../../assets/tileSet/tileSet';
import styles from './TilesList.module.css';
import { TileComponent } from './TileComponent';

export function TilesList() {
  return (
    <div className={styles.list}>
      <SubSubHeader tabsLabel="Sort and filter">placeholder for sort/filter</SubSubHeader>
      <ul className={styles.items} aria-label="Tiles">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <TileComponent tile={tile} />
          </li>
        ))}
      </ul>
    </div>
  );
}
