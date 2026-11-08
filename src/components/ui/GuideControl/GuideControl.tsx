import {
  formatGuidanceScale,
  isGuidanceScale,
  GUIDANCE_SCALE_MAX,
  GUIDANCE_SCALE_MIN,
} from '../../../services/generation/guidanceScale';
import { defaultImageGuidanceScale } from '../../../services/fal/models';
import { NumericParamBar } from '../paramBar/NumericParamBar';

/** Guidance scale param bar; `defaultValue` is restored by reset (defaults to default image model). */
export interface GuideControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  defaultValue?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GuideControl({
  value,
  onChange,
  disabled = false,
  className,
  defaultValue = defaultImageGuidanceScale(),
  open,
  onOpenChange,
}: GuideControlProps) {
  return (
    <NumericParamBar
      icon="guide"
      label="Guidance"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      inputMode="decimal"
      formatDisplay={formatGuidanceScale}
      isValid={isGuidanceScale}
      step={0.1}
      min={GUIDANCE_SCALE_MIN}
      max={GUIDANCE_SCALE_MAX}
      defaultValue={defaultValue}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
