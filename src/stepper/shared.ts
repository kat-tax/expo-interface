import type {StepperProps} from './types';

/** Clamps `next` into `[min, max]`, rounding away float drift from repeated steps. */
export function clampStep(next: number, min?: number, max?: number): number {
  let value = Math.round(next * 1e6) / 1e6;
  if (min != null) value = Math.max(min, value);
  if (max != null) value = Math.min(max, value);
  return value;
}

/** Whether each button is pressable given the bounds and disabled state. */
export function stepBounds({value, min, max, disabled}: StepperProps) {
  return {
    canDecrement: !disabled && (min == null || value > min),
    canIncrement: !disabled && (max == null || value < max),
  };
}
