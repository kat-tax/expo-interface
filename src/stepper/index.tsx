import './stepper.css';
import type {CSSProperties} from 'react';
import type {StepperProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {Label} from '../typography';
import {flatten} from '../theme';
import {clampStep, stepBounds} from './shared';

/**
 * On web the control is two native `<button>` elements in an iOS-style pill,
 * with the value shown beside them. The row mirrors the native layout: label
 * on the leading edge, control pinned to the trailing edge.
 */
export function Stepper(props: StepperProps) {
  const {label, value, onValueChange, step = 1, min, max, formatValue, disabled, testID, style} = props;
  const {canDecrement, canIncrement} = stepBounds(props);
  const vars = flatten(StyleSheet.flatten(style) as TextStyle) as CSSProperties;
  return (
    <div
      className={['ui-stepper', disabled && 'ui-stepper--disabled'].filter(Boolean).join(' ')}
      style={vars}
      data-testid={testID}>
      {label != null ? <Label color="label" style={{flexShrink: 1}}>{label}</Label> : null}
      <div className="ui-stepper__control">
        <Label color="secondaryLabel">{formatValue ? formatValue(value) : String(value)}</Label>
        <div className="ui-stepper__buttons" role="group" aria-label={label}>
          <button
            type="button"
            className="ui-stepper__button"
            aria-label="Decrement"
            disabled={!canDecrement}
            onClick={() => onValueChange(clampStep(value - step, min, max))}>
            −
          </button>
          <button
            type="button"
            className="ui-stepper__button"
            aria-label="Increment"
            disabled={!canIncrement}
            onClick={() => onValueChange(clampStep(value + step, min, max))}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}
