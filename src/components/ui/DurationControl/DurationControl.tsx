import {
  VIDEO_DURATION_DEFAULT,
  VIDEO_DURATION_MAX,
  VIDEO_DURATION_MIN,
} from '../../../services/generation/videoDuration';
import { NumericParamBar } from '../paramBar/NumericParamBar';

/** Video duration (seconds) param bar; default range Kling [3, 15]. */
export interface DurationControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  defaultValue?: number;
  /** Model-specific duration clamp (e.g. Wan R2V [2, 10]). */
  min?: number;
  max?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DurationControl({
  value,
  onChange,
  disabled = false,
  className,
  defaultValue = VIDEO_DURATION_DEFAULT,
  min = VIDEO_DURATION_MIN,
  max = VIDEO_DURATION_MAX,
  open,
  onOpenChange,
}: DurationControlProps) {
  return (
    <NumericParamBar
      icon="clock"
      label="Duration"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      inputMode="numeric"
      formatDisplay={(seconds) => `${seconds}s`}
      parse={(raw) => Number(raw.replace(/s$/i, '').trim())}
      isValid={(candidate) =>
        Number.isInteger(candidate) && candidate >= min && candidate <= max
      }
      step={1}
      min={min}
      max={max}
      defaultValue={defaultValue}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
