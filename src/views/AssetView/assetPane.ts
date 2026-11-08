export const ASSET_PANES = [
  { id: 'tiles', label: 'TILES' },
  { id: 'rules', label: 'RULES' },
  { id: 'config', label: 'CONFIG' },
] as const;

export type AssetPane = (typeof ASSET_PANES)[number]['id'];

export function isAssetPane(id: string): id is AssetPane {
  return ASSET_PANES.some((item) => item.id === id);
}
