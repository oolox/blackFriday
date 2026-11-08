import type { Tile, TileAction, TileType } from '../../../../types/tile';

export type TileSortField = 'name' | 'type' | 'action';
export type TileSortDirection = 'asc' | 'desc';
export type TileTypeFilter = 'all' | TileType;
export type TileActionFilter = 'all' | TileAction;

export interface TileListQuery {
  type: TileTypeFilter;
  action: TileActionFilter;
  sortField: TileSortField;
  sortDirection: TileSortDirection;
}

export const TILE_SORT_FIELD_OPTIONS: ReadonlyArray<{ value: TileSortField; label: string }> = [
  { value: 'name', label: 'NAME' },
  { value: 'type', label: 'TYPE' },
  { value: 'action', label: 'ACTION' },
];

export const TILE_TYPE_FILTER_OPTIONS: ReadonlyArray<{ value: TileTypeFilter; label: string }> = [
  { value: 'all', label: 'ALL TYPES' },
  { value: 'struct', label: 'STRUCT' },
  { value: 'product', label: 'PRODUCT' },
  { value: 'trigger', label: 'TRIGGER' },
];

const ACTION_ORDER: readonly TileAction[] = [
  'wall',
  'floor',
  'door',
  'surface',
  'purchase',
  'speedUp',
  'sale',
  'slide',
  'register',
  'slow',
];

export const TILE_ACTION_FILTER_OPTIONS: ReadonlyArray<{ value: TileActionFilter; label: string }> =
  [
    { value: 'all', label: 'ALL ACTIONS' },
    ...ACTION_ORDER.map((action) => ({ value: action, label: action.toUpperCase() })),
  ];

export const DEFAULT_TILE_LIST_QUERY: TileListQuery = {
  type: 'all',
  action: 'all',
  sortField: 'name',
  sortDirection: 'asc',
};

function actionOf(tile: Tile): string {
  return tile.actAs?.action ?? '';
}

function compareTiles(a: Tile, b: Tile, field: TileSortField): number {
  const byName = a.name.localeCompare(b.name);
  if (field === 'name') {
    return byName;
  }
  const primary =
    field === 'type' ? a.type.localeCompare(b.type) : actionOf(a).localeCompare(actionOf(b));
  return primary !== 0 ? primary : byName;
}

export function queryTiles(tiles: readonly Tile[], query: TileListQuery): Tile[] {
  const filtered = tiles.filter((tile) => {
    if (query.type !== 'all' && tile.type !== query.type) {
      return false;
    }
    if (query.action !== 'all' && tile.actAs?.action !== query.action) {
      return false;
    }
    return true;
  });

  const direction = query.sortDirection === 'asc' ? 1 : -1;
  return [...filtered].sort(
    (a, b) => compareTiles(a, b, query.sortField) * direction,
  );
}
