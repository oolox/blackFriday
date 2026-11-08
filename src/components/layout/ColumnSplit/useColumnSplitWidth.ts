import { useCallback, useRef, useState } from 'react';
import {
  hasStoredColumnSplitWidth,
  readColumnSplitWidth,
  writeColumnSplitWidth,
  type ColumnSplitWidthOptions,
} from './columnSplitWidth';

/**
 * Column width lives in local state and localStorage.
 * Width is not read back from storage on every render, so a drag can update
 * without recreating the resize observer.
 */
export function useColumnSplitWidth(options: ColumnSplitWidthOptions, defaultRatio?: number) {
  const [widthPx, setWidthPxState] = useState(() => readColumnSplitWidth(options));
  const widthRef = useRef(widthPx);

  const setWidth = useCallback(
    (nextWidthPx: number, containerWidthPx?: number) => {
      const written = writeColumnSplitWidth(nextWidthPx, containerWidthPx, options);
      widthRef.current = written;
      setWidthPxState(written);
    },
    [options],
  );

  const syncFromContainer = useCallback(
    (containerWidthPx: number) => {
      if (containerWidthPx <= 0) {
        return;
      }
      if (defaultRatio != null && !hasStoredColumnSplitWidth(options.storageKey)) {
        setWidth(Math.round(containerWidthPx * defaultRatio), containerWidthPx);
        return;
      }
      setWidth(widthRef.current, containerWidthPx);
    },
    [defaultRatio, options.storageKey, setWidth],
  );

  return [widthPx, setWidth, syncFromContainer] as const;
}
