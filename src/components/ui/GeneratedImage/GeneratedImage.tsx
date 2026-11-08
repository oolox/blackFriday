import type { CSSProperties, ReactNode } from 'react';
import type { ImageTaskStatus } from '../../../services/fal/imageService';
import { ButtonStrip } from '../ButtonStrip';
import { ButtonToggle, type ButtonToggleValue } from '../ButtonToggle';
import { GuideControl } from '../GuideControl';
import { IconButton } from '../IconButton/IconButton';
import { SeedGenerator } from '../SeedGenerator';
import { StepsControl } from '../StepsControl';
import { ToggleSelect, type ToggleSelectItem } from '../ToggleSelect';
import styles from './GeneratedImage.module.css';

/**
 * Presentational image generator. View state and controls are owned by the container;
 * this component only renders UI and invokes callbacks.
 * `footer` renders the prompt column. Preview media lives in the gallery
 * (`GalleryGenerationPending` while loading; saved thumbs when ready).
 * Hosts that own generate in the prompt row set `showActionStrip={false}`.
 */
export interface GeneratedImageProps {
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
  emptyHint?: string;
  footer?: ReactNode;
  viewState: 'idle' | 'loading' | 'ready' | 'error';
  objectUrl: string | null;
  errorMessage: string | null;
  taskStatus: ImageTaskStatus | null;
  trimmedPrompt: string;
  canGenerate: boolean;
  /** When false, hide seed / guidance / steps (host owns them, e.g. IMG subheader). */
  showParamControls?: boolean;
  /** When false, hide the model toggle (host owns it, e.g. Session subheader). */
  showModelSelect?: boolean;
  /**
   * When false, hide Generate / ratio / model / params / negative (session prompt row owns them).
   * Defaults to true for character/IMG hosts that still need under-generator actions.
   */
  showActionStrip?: boolean;
  aspectRatio: ButtonToggleValue;
  sizeScale: ButtonToggleValue;
  generateSizeLabel: string;
  selectedModelId: string;
  seed: number;
  seedLocked: boolean;
  guidanceScale: number;
  steps: number;
  transparentBackground: boolean;
  supportsTransparentBackground: boolean;
  openParams: Partial<Record<'model' | 'seed' | 'guide' | 'steps', boolean>>;
  modelItems: ToggleSelectItem[];
  modelGuidanceDefault: number;
  modelStepsDefault: number;
  negativePromptEnabled: boolean;
  hasActiveNegative: boolean;
  viewerOpen: boolean;
  createSeed: () => number;
  onGenerate: () => void;
  onClear: () => void;
  onAspectChange: (value: ButtonToggleValue) => void;
  onSizeScaleChange: (value: ButtonToggleValue) => void;
  onModelChange: (modelId: string) => void;
  onSeedChange: (seed: number) => void;
  onSeedLockedChange: (locked: boolean) => void;
  onGuidanceChange: (value: number) => void;
  onStepsChange: (value: number) => void;
  onTransparentBackgroundChange: (enabled: boolean) => void;
  onNegativePromptToggle: () => void;
  onParamOpenChange: (
    param: 'model' | 'seed' | 'guide' | 'steps',
  ) => (open: boolean) => void;
  onViewerOpenChange: (open: boolean) => void;
}

export function GeneratedImage({
  disabled = false,
  className,
  style,
  label = 'Generated image',
  footer,
  viewState,
  errorMessage,
  canGenerate,
  showModelSelect = true,
  showParamControls = true,
  showActionStrip = true,
  aspectRatio,
  sizeScale,
  generateSizeLabel,
  selectedModelId,
  seed,
  seedLocked,
  guidanceScale,
  steps,
  transparentBackground,
  supportsTransparentBackground,
  openParams,
  modelItems,
  modelGuidanceDefault,
  modelStepsDefault,
  negativePromptEnabled,
  hasActiveNegative,
  createSeed,
  onGenerate,
  onAspectChange,
  onSizeScaleChange,
  onModelChange,
  onSeedChange,
  onSeedLockedChange,
  onGuidanceChange,
  onStepsChange,
  onTransparentBackgroundChange,
  onNegativePromptToggle,
  onParamOpenChange,
}: GeneratedImageProps) {
  const classes = [styles.root, className].filter(Boolean).join(' ');
  const rootStyle: CSSProperties = {
    ...style,
    width: '100%',
    maxWidth: '100%',
  };

  return (
    <figure className={classes} style={rootStyle} aria-label={label}>
      {footer ? <div className={styles.promptColumn}>{footer}</div> : null}
      {viewState === 'error' && errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
      {showActionStrip ? (
        <ButtonStrip aria-label="Generator actions">
          <IconButton
            icon="generate"
            label="Generate"
            variant="secondary"
            size="md"
            disabled={!canGenerate}
            onClick={onGenerate}
          />
          <ButtonToggle
            icons={['ratio-square', 'ratio-16x9', 'ratio-9x16', 'ratio-square-sm']}
            labels={['Square 1:1', 'Wide 16:9', 'Portrait 9:16', 'Square 512']}
            value={aspectRatio}
            onChange={onAspectChange}
            variant="secondary"
            size="md"
            disabled={disabled || viewState === 'loading'}
          />
          <ButtonToggle
            icons={['thumb-sm', 'thumb-md']}
            labels={['Generate size small', 'Generate size large']}
            value={sizeScale}
            onChange={onSizeScaleChange}
            variant="secondary"
            size="md"
            disabled={disabled || viewState === 'loading'}
          />
          <span className={styles.sizeLabel} aria-live="polite">
            {generateSizeLabel}
          </span>
          {showModelSelect ? (
            <ToggleSelect
              label="Model"
              items={modelItems}
              value={selectedModelId}
              disabled={disabled}
              open={Boolean(openParams.model)}
              onOpenChange={onParamOpenChange('model')}
              onChange={onModelChange}
            />
          ) : null}
          {showParamControls ? (
            <>
              <SeedGenerator
                value={seed}
                createSeed={createSeed}
                disabled={disabled}
                locked={seedLocked}
                onLockedChange={onSeedLockedChange}
                open={Boolean(openParams.seed)}
                onOpenChange={onParamOpenChange('seed')}
                onChange={onSeedChange}
              />
              <GuideControl
                value={guidanceScale}
                defaultValue={modelGuidanceDefault}
                disabled={disabled}
                open={Boolean(openParams.guide)}
                onOpenChange={onParamOpenChange('guide')}
                onChange={onGuidanceChange}
              />
              <StepsControl
                value={steps}
                defaultValue={modelStepsDefault}
                disabled={disabled}
                open={Boolean(openParams.steps)}
                onOpenChange={onParamOpenChange('steps')}
                onChange={onStepsChange}
              />
              {supportsTransparentBackground ? (
                <IconButton
                  icon="transparent"
                  label={
                    transparentBackground
                      ? 'Disable transparent background'
                      : 'Enable transparent background'
                  }
                  variant={transparentBackground ? 'primary' : 'secondary'}
                  size="xs"
                  current={transparentBackground}
                  disabled={disabled}
                  onClick={() => onTransparentBackgroundChange(!transparentBackground)}
                />
              ) : null}
            </>
          ) : null}
          <IconButton
            icon="negative-prompt"
            label={
              negativePromptEnabled
                ? 'Disable negative prompt'
                : 'Enable negative prompt'
            }
            variant="secondary"
            size="md"
            current={negativePromptEnabled}
            disabled={disabled || !hasActiveNegative}
            onClick={onNegativePromptToggle}
          />
        </ButtonStrip>
      ) : null}
    </figure>
  );
}
