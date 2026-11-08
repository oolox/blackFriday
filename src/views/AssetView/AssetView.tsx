import { useState } from 'react';
import { SubHeader } from '../../components/ui/SubHeader';
import { Tabs } from '../../components/ui/Tabs';
import { ASSET_PANES, isAssetPane, type AssetPane } from './assetPane';
import { AssetViews } from './AssetViews/AssetViews';
import styles from './AssetView.module.css';

export function AssetView() {
  const [pane, setPane] = useState<AssetPane>('tiles');

  return (
    <section className={styles.pane} aria-label="Assets">
      <SubHeader>
        <Tabs
          aria-label="Asset sections"
          idPrefix="asset"
          items={[...ASSET_PANES]}
          value={pane}
          onChange={(id) => {
            if (isAssetPane(id)) {
              setPane(id);
            }
          }}
        />
      </SubHeader>
      <AssetViews pane={pane} />
    </section>
  );
}
