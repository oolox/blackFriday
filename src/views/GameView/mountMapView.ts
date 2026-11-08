import { Application, Assets, Container, Sprite, Text, type Texture } from 'pixi.js';
import { tiles } from '../../assets/tileSet/tileSet';
import { spriteUrl } from '../../assets/sprites/spriteUrl';
import { cellAt, type GeneratedMap } from '../../types/map';
import {
  TILE_PX,
  VIEW_MARGIN_TILES,
  canPan,
  centerCamera,
  clampCamera,
  panCamera,
  visibleTiles,
  worldToScreen,
  type Camera,
  type ViewSize,
} from './camera';
import { roomIntersects, roomOverlayText } from './roomOverlay';

export interface MapViewHandle {
  redraw: () => void;
  release: () => void;
}

function viewSize(host: HTMLElement): ViewSize {
  return { widthPx: host.clientWidth, heightPx: host.clientHeight };
}

function spriteSources(map: GeneratedMap): Map<string, string> {
  const sources = new Map<string, string>();
  for (const id of map.palette) {
    if (!id || sources.has(id)) {
      continue;
    }
    const tile = tiles.find((candidate) => candidate.id === id);
    const url = tile ? spriteUrl(tile.file) : undefined;
    if (url) {
      sources.set(id, url);
    }
  }
  return sources;
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') != null || canvas.getContext('webgl') != null;
  } catch {
    return false;
  }
}

/**
 * Draw `map` into `host`. The camera is the world point at the center of the pane.
 * `showRooms` is read on each redraw so the overlay can toggle without remounting.
 */
export async function mountMapView(
  host: HTMLElement,
  map: GeneratedMap,
  showRooms: () => boolean,
): Promise<MapViewHandle> {
  const noop = { redraw() {}, release() {} };
  if (!webglAvailable()) {
    return noop;
  }

  const app = new Application();
  try {
    await app.init({
      resizeTo: host,
      background: '#0f0f12',
      antialias: false,
      preference: 'webgl',
    });
  } catch {
    app.destroy();
    return noop;
  }

  host.appendChild(app.canvas);
  const textures = new Map<string, Texture>();
  try {
    for (const [id, url] of spriteSources(map)) {
      textures.set(id, await Assets.load<Texture>(url));
    }
  } catch {
    app.destroy(true);
    return noop;
  }

  const { width, height } = map.layout;
  const tileLayer = new Container();
  const labels = new Container();
  const labelViews = map.layout.rooms.map((room) => {
    const text = new Text({
      text: roomOverlayText(room),
      anchor: 0.5,
      style: {
        fill: '#f4f4f5',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        align: 'center',
        stroke: { color: '#0a0a0c', width: 3 },
      },
    });
    labels.addChild(text);
    return { room, text };
  });
  app.stage.addChild(tileLayer);
  app.stage.addChild(labels);

  let camera: Camera = centerCamera(width, height);
  let drag: { pointerId: number; x: number; y: number; camera: Camera } | null = null;

  const updateCursor = () => {
    const view = viewSize(host);
    const panning = canPan(width, view.widthPx, TILE_PX) || canPan(height, view.heightPx, TILE_PX);
    host.style.cursor = drag ? 'grabbing' : panning ? 'grab' : 'default';
  };

  const redraw = () => {
    const view = viewSize(host);
    if (view.widthPx < 1 || view.heightPx < 1) {
      return;
    }
    camera = clampCamera(camera, width, height, view, TILE_PX);
    const window = visibleTiles(camera, width, height, view, TILE_PX, VIEW_MARGIN_TILES);
    for (const child of tileLayer.removeChildren()) {
      child.destroy();
    }
    for (let y = window.y0; y < window.y1; y++) {
      for (let x = window.x0; x < window.x1; x++) {
        const paletteIndex = cellAt(width, height, map.cells, x, y);
        const id = map.palette[paletteIndex];
        const texture = id ? textures.get(id) : undefined;
        if (!texture) {
          continue;
        }
        const screen = worldToScreen(x, y, camera, view, TILE_PX);
        const sprite = new Sprite(texture);
        sprite.position.set(screen.x, screen.y);
        sprite.width = TILE_PX;
        sprite.height = TILE_PX;
        tileLayer.addChild(sprite);
      }
    }
    const overlay = showRooms();
    labels.visible = overlay;
    if (overlay) {
      for (const entry of labelViews) {
        const inside = roomIntersects(entry.room, window.x0, window.y0, window.x1, window.y1);
        entry.text.visible = inside;
        if (!inside) {
          continue;
        }
        const center = worldToScreen(
          entry.room.x + entry.room.width / 2,
          entry.room.y + entry.room.height / 2,
          camera,
          view,
          TILE_PX,
        );
        entry.text.position.set(center.x, center.y);
      }
    }
    updateCursor();
  };

  const onPointerDown = (event: PointerEvent) => {
    const view = viewSize(host);
    if (!canPan(width, view.widthPx, TILE_PX) && !canPan(height, view.heightPx, TILE_PX)) {
      return;
    }
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      camera: { ...camera },
    };
    host.setPointerCapture(event.pointerId);
    updateCursor();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    camera = panCamera(drag.camera, event.clientX - drag.x, event.clientY - drag.y, TILE_PX);
    redraw();
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    drag = null;
    updateCursor();
  };

  host.addEventListener('pointerdown', onPointerDown);
  host.addEventListener('pointermove', onPointerMove);
  host.addEventListener('pointerup', onPointerUp);
  host.addEventListener('pointercancel', onPointerUp);
  const observer = new ResizeObserver(() => redraw());
  observer.observe(host);
  redraw();

  return {
    redraw,
    release() {
      observer.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', onPointerUp);
      app.destroy(true, { children: true });
    },
  };
}
