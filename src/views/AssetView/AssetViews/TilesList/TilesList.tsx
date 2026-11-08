import { useState } from 'react';
import { tiles } from '../../../../assets/tileSet/tileSet';
import { DropdownSelect } from '../../../../components/ui/DropdownSelect';
import { SubSubHeader } from '../../../../components/ui/SubSubHeader';
import styles from './TilesList.module.css';
import { TileComponent } from './TileComponent';
import {
  DEFAULT_TILE_LIST_QUERY,
  TILE_ACTION_FILTER_OPTIONS,
  TILE_SORT_FIELD_OPTIONS,
  TILE_TYPE_FILTER_OPTIONS,
  queryTiles,
  type TileActionFilter,
  type TileListQuery,
  type TileSortField,
  type TileTypeFilter,
} from './tileListQuery';

export function TilesList() {
  const [query, setQuery] = useState<TileListQuery>(DEFAULT_TILE_LIST_QUERY);
  const visible = queryTiles(tiles, query);
  const directionLabel = query.sortDirection === 'asc' ? 'ascending' : 'descending';

  const setType = (type: TileTypeFilter) => setQuery((current) => ({ ...current, type }));
  const setAction = (action: TileActionFilter) => setQuery((current) => ({ ...current, action }));
  const setSort = (field: TileSortField) =>
    setQuery((current) => {
      if (field === current.sortField) {
        return {
          ...current,
          sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      return { ...current, sortField: field };
    });

  return (
    <div className={styles.list}>
      <SubSubHeader tabsLabel="Sort and filter">
        <div className={styles.controls}>
          <DropdownSelect
            className={styles.control}
            aria-label={`Sort ${directionLabel}`}
            icon="sort"
            options={TILE_SORT_FIELD_OPTIONS}
            value={query.sortField}
            onChange={(value) => setSort(value as TileSortField)}
          />
          <DropdownSelect
            className={styles.control}
            aria-label="Filter type"
            options={TILE_TYPE_FILTER_OPTIONS}
            value={query.type}
            onChange={(value) => setType(value as TileTypeFilter)}
          />
          <DropdownSelect
            className={styles.control}
            aria-label="Filter action"
            options={TILE_ACTION_FILTER_OPTIONS}
            value={query.action}
            onChange={(value) => setAction(value as TileActionFilter)}
          />
        </div>
      </SubSubHeader>
      {visible.length === 0 ? (
        <p className={styles.empty}>No tiles</p>
      ) : (
        <ul className={styles.items} aria-label="Tiles">
          {visible.map((tile) => (
            <li key={tile.id}>
              <TileComponent tile={tile} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
