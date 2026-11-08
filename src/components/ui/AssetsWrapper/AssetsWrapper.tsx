import { useEffect, useState, type ReactNode, type TransitionEvent } from 'react';
import { LOCAL_STORAGE_KEYS } from '../../../services/localStorage';
import { ColumnSplit } from '../../layout/ColumnSplit';
import { FileDropZone } from '../FileDropZone';
import { SubSubHeader } from '../SubSubHeader';
import styles from './AssetsWrapper.module.css';

const ASSETS_GENERATOR_DEFAULT_RATIO = 0.5;
const ASSETS_GENERATOR_DEFAULT_WIDTH_PX = 720;
const ASSETS_GENERATOR_MIN_WIDTH_PX = 200;
/** Keep in sync with `.galleryLeading` transition duration. */
const GALLERY_LEADING_EXIT_MS = 240;

/**
 * Presentational generator + gallery layout.
 * Orchestration lives in feature containers. The primary gallery is a slot so
 * hosts can be image-first (IMG/VID frames), text-first (TXT), etc.
 */
export interface AssetsWrapperProps {
  generatorOpen: boolean;
  className?: string;
  generator?: ReactNode;
  /**
   * Optional chrome above the generator. `undefined` in `bare` (generator)
   * views uses an empty SubSubHeader; Character omits it.
   */
  generatorHeader?: ReactNode | null;
  /** Optional content above the primary gallery (e.g. upload controls). */
  galleryHeader?: ReactNode;
  /**
   * Fixed slot below the gallery header (e.g. in-flight generation pending).
   * Stays pinned; only {@link gallery} / {@link galleryFooter} scroll beneath it.
   * Slides in from the top and out to the top.
   */
  galleryLeading?: ReactNode;
  /** Primary gallery (images, texts, …). */
  gallery: ReactNode;
  /** Optional content below the primary gallery (e.g. saved-videos strip). */
  galleryFooter?: ReactNode;
  splitStorageKey?: string;
  /**
   * Which pane’s width is persisted. Default `left` (generator) — Character view.
   * Generator view passes `right` so the saved-assets column is the sized pane.
   */
  sizedPane?: 'left' | 'right';
  /** Drop outer border and pane padding (Generator view). */
  bare?: boolean;
  /** Remove generator-pane inset so a surface (e.g. GameBoard) can fill 100%. */
  flushGenerator?: boolean;
  /**
   * When set, the gallery column accepts filesystem drops and LuxNova
   * asset-library drags (linked by asset id).
   */
  onFilesDrop?: (files: File[]) => void;
  /** Library asset ids dropped onto the gallery (link, do not remint). */
  onAssetIdsDrop?: (assetIds: string[]) => void;
  filesDropDisabled?: boolean;
  filesDropAccept?: string;
  filesDropLabel?: string;
  /** Accessible name for the resize handle. */
  splitAriaLabel?: string;
}

export function AssetsWrapper({
  generatorOpen,
  className,
  generator,
  generatorHeader,
  galleryHeader,
  galleryLeading,
  gallery,
  galleryFooter,
  splitStorageKey = LOCAL_STORAGE_KEYS.assetsGeneratorWidthPx,
  sizedPane = 'left',
  bare = false,
  flushGenerator = false,
  onFilesDrop,
  onAssetIdsDrop,
  filesDropDisabled = false,
  filesDropAccept,
  filesDropLabel = 'Drop Files Here',
  splitAriaLabel,
}: AssetsWrapperProps) {
  const classes = [
    styles.root,
    generatorOpen ? styles.open : styles.closed,
    bare ? styles.bare : '',
    flushGenerator ? styles.flushGenerator : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const leadingWanted = galleryLeading != null;
  const [leadingMounted, setLeadingMounted] = useState(leadingWanted);
  const [leadingOpen, setLeadingOpen] = useState(false);
  const [leadingContent, setLeadingContent] = useState<ReactNode>(galleryLeading);

  useEffect(() => {
    if (galleryLeading != null) {
      setLeadingContent(galleryLeading);
    }
  }, [galleryLeading]);

  useEffect(() => {
    if (leadingWanted) {
      setLeadingMounted(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setLeadingOpen(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setLeadingOpen(false);
    return undefined;
  }, [leadingWanted]);

  useEffect(() => {
    if (leadingWanted || !leadingMounted) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setLeadingMounted(false);
      setLeadingContent(null);
    }, GALLERY_LEADING_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leadingWanted, leadingMounted]);

  const onLeadingTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'grid-template-rows') {
      return;
    }
    if (!leadingOpen) {
      setLeadingMounted(false);
      setLeadingContent(null);
    }
  };

  const galleryInner = (
    <>
      {galleryHeader ? <div className={styles.galleryHeader}>{galleryHeader}</div> : null}
      {leadingMounted ? (
        <div
          className={[styles.galleryLeading, leadingOpen ? styles.galleryLeadingOpen : '']
            .filter(Boolean)
            .join(' ')}
          onTransitionEnd={onLeadingTransitionEnd}
        >
          <div className={styles.galleryLeadingClip}>
            <div className={styles.galleryLeadingInner}>{leadingContent}</div>
          </div>
        </div>
      ) : null}
      <div className={styles.galleryBody}>
        {gallery}
        {galleryFooter ? (
          <div className={styles.galleryFooter}>{galleryFooter}</div>
        ) : null}
      </div>
    </>
  );

  const resolvedGeneratorHeader =
    generatorHeader !== undefined
      ? generatorHeader
      : bare
        ? <SubSubHeader tabsLabel="Generator" />
        : null;

  const galleryColumn = (
    <div className={styles.galleryPane}>
      {onFilesDrop || onAssetIdsDrop ? (
        <FileDropZone
          className={styles.galleryDrop}
          disabled={filesDropDisabled}
          accept={filesDropAccept}
          onFiles={onFilesDrop ?? (() => undefined)}
          onAssetIds={onAssetIdsDrop}
          label={filesDropLabel}
        >
          {galleryInner}
        </FileDropZone>
      ) : (
        galleryInner
      )}
    </div>
  );

  return (
    <div className={classes}>
      <div className={styles.body}>
        {generatorOpen ? (
          <ColumnSplit
            aria-label={
              splitAriaLabel ??
              (sizedPane === 'right'
                ? 'Resize saved assets column'
                : 'Resize generator column')
            }
            sizedPane={sizedPane}
            storageKey={splitStorageKey}
            defaultRatio={ASSETS_GENERATOR_DEFAULT_RATIO}
            defaultWidthPx={ASSETS_GENERATOR_DEFAULT_WIDTH_PX}
            minWidthPx={ASSETS_GENERATOR_MIN_WIDTH_PX}
            left={
              <div className={styles.generatorPane}>
                {resolvedGeneratorHeader ? (
                  <div className={styles.generatorHeader}>{resolvedGeneratorHeader}</div>
                ) : null}
                <div className={styles.generate}>{generator}</div>
              </div>
            }
            right={galleryColumn}
          />
        ) : (
          galleryColumn
        )}
      </div>
    </div>
  );
}
