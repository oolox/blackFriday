import { spriteUrl } from '../../../../assets/sprites/spriteUrl';
import type { Tile, TileActAs } from '../../../../types/tile';
import styles from './TileComponent.module.css';

function actAsParams(actAs: TileActAs): Array<[string, number]> {
  switch (actAs.action) {
    case 'floor':
    case 'wall':
    case 'door':
    case 'shelf':
    case 'slow':
      return [['speed', actAs.speed]];
    case 'characterSpeed':
      return [
        ['speed', actAs.speed],
        ['duration', actAs.duration],
      ];
    case 'sale':
      return [
        ['cost', actAs.cost],
        ['duration', actAs.duration],
      ];
    case 'purchase':
      return [['cost', actAs.cost]];
    case 'slide':
    case 'register':
      return [];
  }
}

export function TileComponent({ tile }: { tile: Tile }) {
  const src = spriteUrl(tile.file);
  const params = tile.actAs ? actAsParams(tile.actAs) : [];

  return (
    <div className={styles.tile}>
      {src ? <img className={styles.thumb} src={src} alt="" /> : null}
      <div className={styles.identity}>
        <span className={styles.name}>{tile.name}</span>
        <span className={styles.type}>{tile.type}</span>
      </div>
      {tile.actAs ? (
        <div className={styles.act}>
          <span className={styles.action}>{tile.actAs.action}</span>
          {params.length > 0 ? (
            <span className={styles.params}>
              {params.map(([key, value]) => (
                <span key={key}>
                  {key}:{value}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
