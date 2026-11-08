import { useEffect, useRef } from 'react';
import type { GeneratedMap } from '../../types/map';
import styles from './GameView.module.css';
import { mountMapView, type MapViewHandle } from './mountMapView';

export function MapCanvas({ map, showRooms }: { map: GeneratedMap; showRooms: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const showRoomsRef = useRef(showRooms);
  const handleRef = useRef<MapViewHandle | null>(null);
  showRoomsRef.current = showRooms;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }
    let disposed = false;
    let handle: MapViewHandle | null = null;
    void mountMapView(host, map, () => showRoomsRef.current).then((next) => {
      if (disposed) {
        next.release();
        return;
      }
      handle = next;
      handleRef.current = next;
    });
    return () => {
      disposed = true;
      handle?.release();
      handleRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    handleRef.current?.redraw();
  }, [showRooms]);

  return <div ref={hostRef} className={styles.stage} role="application" aria-label="Shop floor" />;
}
