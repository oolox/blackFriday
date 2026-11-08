/** Screen size of one map cell. Struct sprites are 50×50, and one cell is one meter. */
export const TILE_PX = 50;

/** Extra tiles drawn past the viewport so a pan does not show a gap. */
export const VIEW_MARGIN_TILES = 1;

export interface Camera {
  /** World position, in tiles, under the center of the pane. */
  x: number;
  y: number;
}

export interface ViewSize {
  widthPx: number;
  heightPx: number;
}

export interface TileWindow {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function centerCamera(mapWidth: number, mapHeight: number): Camera {
  return { x: mapWidth / 2, y: mapHeight / 2 };
}

/** True when this axis is larger than the pane and can move. */
export function canPan(mapTiles: number, viewPx: number, tilePx: number): boolean {
  return viewPx / tilePx < mapTiles;
}

function clampAxis(center: number, mapTiles: number, viewPx: number, tilePx: number): number {
  const viewTiles = viewPx / tilePx;
  if (viewTiles >= mapTiles) {
    return mapTiles / 2;
  }
  const half = viewTiles / 2;
  return Math.min(mapTiles - half, Math.max(half, center));
}

/** Keep the visible window inside the building box. A fitting axis stays centered. */
export function clampCamera(
  camera: Camera,
  mapWidth: number,
  mapHeight: number,
  view: ViewSize,
  tilePx: number,
): Camera {
  return {
    x: clampAxis(camera.x, mapWidth, view.widthPx, tilePx),
    y: clampAxis(camera.y, mapHeight, view.heightPx, tilePx),
  };
}

/** Dragging the map right moves the camera left. */
export function panCamera(
  camera: Camera,
  deltaXPx: number,
  deltaYPx: number,
  tilePx: number,
): Camera {
  return {
    x: camera.x - deltaXPx / tilePx,
    y: camera.y - deltaYPx / tilePx,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera,
  view: ViewSize,
  tilePx: number,
): { x: number; y: number } {
  return {
    x: (worldX - camera.x) * tilePx + view.widthPx / 2,
    y: (worldY - camera.y) * tilePx + view.heightPx / 2,
  };
}

/** Inclusive start, exclusive end, padded by `marginTiles` and clipped to the map. */
export function visibleTiles(
  camera: Camera,
  mapWidth: number,
  mapHeight: number,
  view: ViewSize,
  tilePx: number,
  marginTiles: number,
): TileWindow {
  const halfW = view.widthPx / tilePx / 2;
  const halfH = view.heightPx / tilePx / 2;
  return {
    x0: Math.max(0, Math.floor(camera.x - halfW) - marginTiles),
    y0: Math.max(0, Math.floor(camera.y - halfH) - marginTiles),
    x1: Math.min(mapWidth, Math.ceil(camera.x + halfW) + marginTiles),
    y1: Math.min(mapHeight, Math.ceil(camera.y + halfH) + marginTiles),
  };
}
