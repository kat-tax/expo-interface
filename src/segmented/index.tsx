import './segmented.css';
import type {CSSProperties} from 'react';
import type {PickerValue} from '../picker/types';
import type {SegmentedControlProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {Label} from '../typography';
import {flatten} from '../theme';
import {extractItems, PickerItem, useSelectedValue} from '../picker/shared';

/**
 * On web the control is a `radiogroup` of native `<button>`s styled after the
 * iOS segmented control (grey pill, raised selected segment). The row mirrors
 * the native layout: label on the leading edge, control on the trailing edge.
 */
function SegmentedControlComponent<T extends PickerValue>({
  label,
  children,
  selectedValue,
  onValueChange,
  disabled,
  accentColor,
  testID,
  style,
}: SegmentedControlProps<T>) {
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const vars = flatten(StyleSheet.flatten(style) as TextStyle) as CSSProperties;
  return (
    <div
      className={['ui-segmented', disabled && 'ui-segmented--disabled'].filter(Boolean).join(' ')}
      style={vars}
      data-testid={testID}>
      {label != null ? <Label color="label" style={{flexShrink: 1}}>{label}</Label> : null}
      <div className="ui-segmented__group" role="radiogroup" aria-label={label}>
        {items.map(item => {
          const selected = item.value === current;
          return (
            <button
              key={String(item.value)}
              type="button"
              role="radio"
              className="ui-segmented__item"
              aria-checked={selected}
              disabled={disabled}
              style={selected && accentColor ? {color: accentColor} : undefined}
              onClick={() => setValue(item.value)}>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

SegmentedControlComponent.Item = PickerItem;

export {SegmentedControlComponent as SegmentedControl};
