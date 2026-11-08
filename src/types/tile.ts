/** Datasource kinds folded into the tile catalog. */
export type TileType = 'struct' | 'product' | 'trigger';

/** How a placed tile behaves. */
export type TileAction = TileActAs['action'];

/** Walk speed on a map tile. 0 is impassable, as with a wall. 1 is full speed. */
export interface TileMoveActAs {
  action: 'floor' | 'wall' | 'door' | 'shelf';
  speed: number;
}

/** Temporary speed change for the character who steps on the tile. */
export interface TileCharacterSpeedActAs {
  action: 'characterSpeed';
  speed: number;
  duration: number;
}

/** Price factor applied by a sale tile, for a limited time. */
export interface TileSaleActAs {
  action: 'sale';
  cost: number;
  duration: number;
}

/** Price of a product the player can buy. */
export interface TilePurchaseActAs {
  action: 'purchase';
  cost: number;
}

export interface TileSlideActAs {
  action: 'slide';
}

export interface TileRegisterActAs {
  action: 'register';
}

/** Speed multiplier applied while the tile is active. */
export interface TileSlowActAs {
  action: 'slow';
  speed: number;
}

export type TileActAs =
  | TileMoveActAs
  | TileCharacterSpeedActAs
  | TileSaleActAs
  | TilePurchaseActAs
  | TileSlideActAs
  | TileRegisterActAs
  | TileSlowActAs;

export interface Tile<TType extends TileType = TileType> {
  id: string;
  type: TType;
  name: string;
  actAs?: TileActAs;
  file: string;
}

/** Flat catalog. `tiles[index]` is a `Tile`. */
export type TileSet = readonly Tile[];
