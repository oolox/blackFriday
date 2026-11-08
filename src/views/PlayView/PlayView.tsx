import { ColumnSplit } from '../../components/layout/ColumnSplit';
import { AssetView } from '../AssetView/AssetView';
import { GameView } from '../GameView/GameView';

const GAME_ASSET_SPLIT_STORAGE_KEY = 'blackfriday.gameAssetWidthPx';

export function PlayView() {
  return (
    <ColumnSplit
      aria-label="Resize game and assets"
      sizedPane="left"
      storageKey={GAME_ASSET_SPLIT_STORAGE_KEY}
      defaultRatio={0.66}
      defaultWidthPx={720}
      minWidthPx={280}
      left={<GameView />}
      right={<AssetView />}
    />
  );
}
