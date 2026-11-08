import type { CSSProperties, ReactNode } from 'react';
import type { VideoTaskStatus } from '../../../services/fal/videoService';
import { ButtonStrip } from '../ButtonStrip';
import { ButtonToggle, type ButtonToggleValue } from '../ButtonToggle';
import { DurationControl } from '../DurationControl';
import { IconButton } from '../IconButton/IconButton';
import { ToggleSelect, type ToggleSelectItem } from '../ToggleSelect';
import styles from './GeneratedVideo.module.css';

export interface GeneratedVideoProps {
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
  emptyHint?: string;
  footer?: ReactNode;
  viewState: 'idle' | 'loading' | 'ready' | 'error';
  objectUrl: string | null;
  errorMessage: string | null;
  taskStatus: VideoTaskStatus | null;
  trimmedPrompt: string;
  canGenerate: boolean;
  duration: number;
  onDurationChange: (duration: number) => void;
  /** Model-specific duration clamp; defaults to the Kling [3, 15] range. */
  durationMin?: number;
  durationMax?: number;
  /** When false, hide duration (VID subheader owns it). */
  showDurationControl?: boolean;
  /** When false, hide the model ToggleSelect (VID uses the subtype switch instead). */
  showModelSelect?: boolean;
  /**
   * When false, hide Generate / duration / model (session prompt row owns generate).
   * Defaults to true for VID hosts that still need under-generator actions.
   */
  showActionStrip?: boolean;
  /** Aspect toggle for models that accept `aspect_ratio` (Wan / Kling O3). */
  showAspectControl?: boolean;
  aspectRatio?: ButtonToggleValue;
  onAspectChange?: (value: ButtonToggleValue) => void;
  /** Size/resolution toggle for models that accept `resolution` (Wan). */
  showResolutionControl?: boolean;
  resolutionScale?: ButtonToggleValue;
  resolutionLabel?: string;
  onResolutionChange?: (value: ButtonToggleValue) => void;
  selectedModelId?: string;
  modelItems?: ToggleSelectItem[];
  modelOpen?: boolean;
  onModelOpenChange?: (open: boolean) => void;
  onGenerate: () => void;
  onClear: () => void;
  onModelChange?: (modelId: string) => void;
}

/**
 * Presentational video generator. Preview media lives in the gallery
 * (`GalleryGenerationPending` while loading). Hosts that own generate in the
 * prompt row set `showActionStrip={false}`.
 */
export function GeneratedVideo({
  disabled = false,
  className,
  style,
  label = 'Generated video',
  footer,
  viewState,
  errorMessage,
  canGenerate,
  duration,
  onDurationChange,
  durationMin,
  durationMax,
  showDurationControl = true,
  showModelSelect = true,
  showActionStrip = true,
  showAspectControl = false,
  aspectRatio = 1,
  onAspectChange,
  showResolutionControl = false,
  resolutionScale = 0,
  resolutionLabel,
  onResolutionChange,
  selectedModelId = '',
  modelItems = [],
  modelOpen = false,
  onModelOpenChange,
  onGenerate,
  onModelChange,
}: GeneratedVideoProps) {
  const classes = [styles.root, className].filter(Boolean).join(' ');
  const controlsDisabled = disabled || viewState === 'loading';

  return (
    <figure className={classes} style={style} aria-label={label}>
      {footer ? <div className={styles.promptColumn}>{footer}</div> : null}
      {viewState === 'error' && errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
      {showActionStrip ? (
        <ButtonStrip aria-label="Video generator actions">
          <IconButton
            icon="generate"
            label="Generate"
            variant="secondary"
            size="md"
            disabled={!canGenerate}
            onClick={onGenerate}
          />
          {showAspectControl ? (
            <ButtonToggle
              icons={['ratio-square', 'ratio-16x9', 'ratio-9x16']}
              labels={['Square 1:1', 'Wide 16:9', 'Portrait 9:16']}
              value={aspectRatio}
              onChange={onAspectChange ?? (() => undefined)}
              variant="secondary"
              size="md"
              disabled={controlsDisabled}
            />
          ) : null}
          {showResolutionControl ? (
            <>
              <ButtonToggle
                icons={['thumb-sm', 'thumb-md']}
                labels={['720p', '1080p']}
                value={resolutionScale}
                onChange={onResolutionChange ?? (() => undefined)}
                variant="secondary"
                size="md"
                disabled={controlsDisabled}
              />
              {resolutionLabel ? (
                <span className={styles.sizeLabel} aria-live="polite">
                  {resolutionLabel}
                </span>
              ) : null}
            </>
          ) : null}
          {showDurationControl ? (
            <DurationControl
              value={duration}
              disabled={controlsDisabled}
              onChange={onDurationChange}
              min={durationMin}
              max={durationMax}
            />
          ) : null}
          {showModelSelect ? (
            <ToggleSelect
              label="Model"
              items={modelItems}
              value={selectedModelId}
              disabled={disabled}
              open={modelOpen}
              onOpenChange={onModelOpenChange ?? (() => undefined)}
              onChange={onModelChange ?? (() => undefined)}
            />
          ) : null}
        </ButtonStrip>
      ) : null}
    </figure>
  );
}
