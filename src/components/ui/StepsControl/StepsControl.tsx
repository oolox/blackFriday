import {
  isSteps,
  STEPS_MAX,
  STEPS_MIN,
} from '../../../services/generation/steps';
import { defaultImageSteps } from '../../../services/fal/models';
import { NumericParamBar } from '../paramBar/NumericParamBar';

/** Steps param bar; `defaultValue` is restored by reset (defaults to default image model). */
export interface StepsControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  defaultValue?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StepsControl({
  value,
  onChange,
  disabled = false,
  className,
  defaultValue = defaultImageSteps(),
  open,
  onOpenChange,
}: StepsControlProps) {
  return (
    <NumericParamBar
      icon="steps"
      label="Steps"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      inputMode="numeric"
      isValid={isSteps}
      step={1}
      min={STEPS_MIN}
      max={STEPS_MAX}
      defaultValue={defaultValue}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
