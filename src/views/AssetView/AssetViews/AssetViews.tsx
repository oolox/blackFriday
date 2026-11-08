import type { AssetPane } from '../assetPane';
import styles from './AssetViews.module.css';
import { ConfigPlaceholder } from './ConfigPlaceholder';
import { RulesPlaceholder } from './RulesPlaceholder';
import { TilesPlaceholder } from './TilesPlaceholder';

const VIEWS = {
  tiles: TilesPlaceholder,
  rules: RulesPlaceholder,
  config: ConfigPlaceholder,
} as const;

export function AssetViews({ pane }: { pane: AssetPane }) {
  const View = VIEWS[pane];

  return (
    <div className={styles.host}>
      <View />
    </div>
  );
}
