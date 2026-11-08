import type { DragEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import {
  dataTransferHasLuxnovaAsset,
  readLuxnovaAssetDragId,
} from '../../../utils/luxnovaAssetDrag';

/** True when the drag payload includes filesystem files (not in-app reorder). */
export function dataTransferHasFiles(dataTransfer: DataTransfer | null | undefined): boolean {
  if (!dataTransfer) {
    return false;
  }
  return Array.from(dataTransfer.types).includes('Files');
}

/**
 * Match a file against an HTML `accept` string (MIME types and/or extensions).
 * Empty / missing accept → all files match.
 */
export function fileMatchesAccept(file: File, accept?: string): boolean {
  const raw = accept?.trim();
  if (!raw || raw === '*/*') {
    return true;
  }
  const tokens = raw
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return tokens.some((token) => {
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1);
      return type.startsWith(prefix);
    }
    if (token.startsWith('.')) {
      return name.endsWith(token);
    }
    if (token === 'image/jpg') {
      return type === 'image/jpeg' || type === 'image/jpg';
    }
    return type === token;
  });
}

export function filterFilesByAccept(files: Iterable<File>, accept?: string): File[] {
  return Array.from(files).filter((file) => fileMatchesAccept(file, accept));
}

export interface UseFileDropZoneOptions {
  disabled?: boolean;
  /** Same format as `<input accept>` (e.g. `image/png,image/jpeg`). */
  accept?: string;
  onFiles: (files: File[]) => void;
  /** Library asset ids from LuxNova asset drag (or empty when none). */
  onAssetIds?: (assetIds: string[]) => void;
}

export interface FileDropZoneHandlers {
  onDragEnter: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

function isAcceptedDrop(dataTransfer: DataTransfer | null | undefined): boolean {
  return (
    dataTransferHasLuxnovaAsset(dataTransfer) || dataTransferHasFiles(dataTransfer)
  );
}

/**
 * Native filesystem drag/drop + LuxNova asset-library drops.
 * Ignores non-file / non-asset drags (e.g. in-gallery reorder).
 * Uses an enter/leave depth counter so nested children do not flicker the active state.
 */
export function useFileDropZone({
  disabled = false,
  accept,
  onFiles,
  onAssetIds,
}: UseFileDropZoneOptions): {
  isDragging: boolean;
  dropProps: FileDropZoneHandlers;
} {
  const [isDragging, setIsDragging] = useState(false);
  const depthRef = useRef(0);

  const resetDrag = useCallback(() => {
    depthRef.current = 0;
    setIsDragging(false);
  }, []);

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isAcceptedDrop(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      depthRef.current += 1;
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isAcceptedDrop(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
    },
    [disabled],
  );

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isAcceptedDrop(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    depthRef.current = Math.max(0, depthRef.current - 1);
    if (depthRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isAcceptedDrop(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      resetDrag();
      if (disabled) {
        return;
      }

      const assetId = readLuxnovaAssetDragId(event.dataTransfer);
      if (assetId) {
        onAssetIds?.([assetId]);
        return;
      }

      const matched = filterFilesByAccept(event.dataTransfer.files, accept);
      if (matched.length > 0) {
        onFiles(matched);
      }
    },
    [accept, disabled, onAssetIds, onFiles, resetDrag],
  );

  return {
    isDragging: isDragging && !disabled,
    dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
