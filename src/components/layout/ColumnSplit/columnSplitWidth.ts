export interface ColumnSplitWidthOptions {
  storageKey: string;
  defaultWidthPx: number;
  minWidthPx: number;
  edgeRatio: number;
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function readItem(key: string): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore private-mode and quota failures.
  }
}

function readPositiveWidthPx(key: string, fallback: number): number {
  const raw = readItem(key)?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
}

function writePositiveWidthPx(key: string, value: number, fallback: number): number {
  const next = Number.isFinite(value) && value > 0 ? Math.round(value) : Math.round(fallback);
  writeItem(key, String(next));
  return next;
}

export function clampColumnSplitWidth(
  widthPx: number,
  containerWidthPx: number | undefined,
  { minWidthPx, edgeRatio }: Pick<ColumnSplitWidthOptions, 'minWidthPx' | 'edgeRatio'>,
): number {
  const rounded = Math.round(widthPx);

  if (!containerWidthPx || containerWidthPx <= 0) {
    return Math.max(minWidthPx, rounded);
  }

  const ratioMin = Math.round(containerWidthPx * edgeRatio);
  const ratioMax = Math.round(containerWidthPx * (1 - edgeRatio));
  const min = Math.min(Math.max(minWidthPx, ratioMin), ratioMax);
  const max = Math.max(min, ratioMax);
  return Math.min(max, Math.max(min, rounded));
}

export function readColumnSplitWidth({
  storageKey,
  defaultWidthPx,
}: Pick<ColumnSplitWidthOptions, 'storageKey' | 'defaultWidthPx'>): number {
  return readPositiveWidthPx(storageKey, defaultWidthPx);
}

export function hasStoredColumnSplitWidth(storageKey: string): boolean {
  return readItem(storageKey) != null;
}

/** Persist column split width. */
export function writeColumnSplitWidth(
  widthPx: number,
  containerWidthPx: number | undefined,
  options: ColumnSplitWidthOptions,
): number {
  const next = clampColumnSplitWidth(widthPx, containerWidthPx, options);
  return writePositiveWidthPx(options.storageKey, next, options.defaultWidthPx);
}
