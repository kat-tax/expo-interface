import './slider.css';
import type {ChangeEvent, CSSProperties} from 'react';
import type {SliderProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {Label} from '../typography';
import {flatten} from '../theme';

/**
 * On web the slider is a native `<input type="range">` element themed through
 * the `accent-color` CSS property, so it reads as a real web control. The row
 * mirrors the native layout: a label on the leading edge with the track
 * filling the remaining width.
 */
export function Slider({
  label,
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 1,
  step,
  disabled,
  accentColor,
  testID,
  style,
}: SliderProps) {
  const vars = {
    ...(accentColor ? {'--ui-slider-accent': accentColor} : null),
    ...flatten((StyleSheet.flatten(style) ?? undefined) as TextStyle | undefined),
  } as CSSProperties;
  const read = (event: ChangeEvent<HTMLInputElement>) => Number(event.target.value);
  return (
    <div
      className={['ui-slider', disabled && 'ui-slider--disabled'].filter(Boolean).join(' ')}
      style={vars}
      data-testid={testID}>
      {label != null ? (
        <Label color="label" style={{flexShrink: 1}}>{label}</Label>
      ) : null}
      <input
        className="ui-slider__input"
        type="range"
        min={min}
        max={max}
        step={step ?? 'any'}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={event => onValueChange(read(event))}
        onPointerUp={event => onSlidingComplete?.(Number(event.currentTarget.value))}
        onKeyUp={event => onSlidingComplete?.(Number(event.currentTarget.value))}
      />
    </div>
  );
}
