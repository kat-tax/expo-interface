import './checkbox.css';
import type {CSSProperties} from 'react';
import type {CheckboxProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {Label} from '../typography';
import {flatten} from '../theme';

/**
 * On web the box is a native `<input type="checkbox">` themed through the
 * `accent-color` CSS property. The whole row is a `<label>`, so clicking the
 * text toggles the box, and the layout mirrors the native rows: label on the
 * leading edge, box pinned to the trailing edge.
 */
export function Checkbox({
  label,
  value,
  onValueChange,
  disabled,
  accentColor,
  testID,
  style,
}: CheckboxProps) {
  const vars = {
    ...(accentColor ? {'--ui-checkbox-accent': accentColor} : null),
    ...flatten((StyleSheet.flatten(style) ?? undefined) as TextStyle | undefined),
  } as CSSProperties;
  const input = (
    <input
      className="ui-checkbox__input"
      type="checkbox"
      checked={value}
      disabled={disabled}
      onChange={event => onValueChange(event.target.checked)}
      data-testid={label == null ? testID : undefined}
      style={label == null ? vars : undefined}
    />
  );

  if (label == null) return input;

  return (
    <label
      className={['ui-checkbox', disabled && 'ui-checkbox--disabled'].filter(Boolean).join(' ')}
      style={vars}
      data-testid={testID}>
      <Label color="label" style={{flexShrink: 1}}>{label}</Label>
      {input}
    </label>
  );
}
