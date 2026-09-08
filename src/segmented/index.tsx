import './segmented.css';
import type {CSSProperties} from 'react';
import type {PickerValue} from '../picker/types';
import type {SegmentedControlProps} from './types';
import {StyleSheet, type TextStyle} from 'react-native';
import {Label} from '../typography';
import {onAccent} from '../accent';
import {flatten} from '../theme';
import {metrics, TRACK_INSET} from './shared';
import {extractItems, PickerItem, useSelectedValue} from '../picker/shared';

/**
 * On web the control is a `radiogroup` of native `<button>`s styled after the
 * iOS segmented control (grey track, raised selected segment). The row mirrors
 * the native layout: label on the leading edge, control on the trailing edge.
 * The geometry comes from `shared.ts` as custom properties, so a size or shape
 * measures the same here as it does on iOS and Android.
 */
function SegmentedControlComponent<T extends PickerValue>({
  label,
  children,
  selectedValue,
  onValueChange,
  disabled,
  accentColor,
  size = 'medium',
  shape = 'rounded',
  testID,
  style,
}: SegmentedControlProps<T>) {
  const items = extractItems<T>(children);
  const [current, setValue] = useSelectedValue(selectedValue, onValueChange, items[0]?.value);
  const m = metrics(size, shape);
  const vars = {
    '--ui-segmented-height': `${m.height}px`,
    '--ui-segmented-radius': `${m.radius}px`,
    '--ui-segmented-segment-radius': `${m.segmentRadius}px`,
    '--ui-segmented-font-size': `${m.fontSize}px`,
    '--ui-segmented-padding': `${m.padding}px`,
    '--ui-segmented-min-width': `${m.minWidth}px`,
    '--ui-segmented-inset': `${TRACK_INSET}px`,
    // An accent fills the selected segment, like `selectedSegmentTintColor`.
    ...(accentColor ? {'--ui-segmented-fill': accentColor, '--ui-segmented-on-fill': onAccent(accentColor)} : null),
    ...flatten(StyleSheet.flatten(style) as TextStyle),
  } as CSSProperties;
  return (
    <div
      className={['ui-segmented', disabled && 'ui-segmented--disabled'].filter(Boolean).join(' ')}
      style={vars}
      data-testid={testID}>
      {label != null ? <Label color="label" style={{flexShrink: 1}}>{label}</Label> : null}
      <div className="ui-segmented__group" role="radiogroup" aria-label={label}>
        {items.map(item => (
          <button
            key={String(item.value)}
            type="button"
            role="radio"
            className="ui-segmented__item"
            aria-checked={item.value === current}
            disabled={disabled}
            onClick={() => setValue(item.value)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

SegmentedControlComponent.Item = PickerItem;

export {SegmentedControlComponent as SegmentedControl};
