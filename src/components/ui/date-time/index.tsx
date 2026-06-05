import type {ChangeEvent, CSSProperties, MouseEvent} from 'react';
import type {DateTimePickerProps} from './types';

import {Pressable, StyleSheet, View} from 'react-native';
import {Label} from '@/components/ui/typography';
import {colors} from '@/theme';
import {formatValue, inputType, parseInputValue, toInputValue, useDateValue} from './shared';

export * from './types';

/**
 * On web the row mirrors the native iOS/Android pill: a label on the leading
 * edge and a rounded pill showing the value, with a transparent native
 * `<input>` layered on top. Clicking the pill opens the browser's built-in
 * date/time picker.
 */
export function DateTimePicker({
  label,
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  disabled,
  accentColor,
  testID,
  style,
}: DateTimePickerProps) {
  const [current, setValue] = useDateValue(value, onChange);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = parseInputValue(event.target.value, mode, current);
    if (next) setValue(next);
  };

  const openPicker = (event: MouseEvent<HTMLInputElement>) => {
    event.currentTarget.showPicker();
  };

  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label
          color="label"
          style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <Pressable
        disabled={disabled}
        style={[styles.pill, disabled && styles.disabled]}>
        <Label
          color={accentColor ?? 'secondary'}
          style={styles.value}>
          {formatValue(current, mode)}
        </Label>
        <input
          type={inputType(mode)}
          value={toInputValue(current, mode)}
          min={minimumDate ? toInputValue(minimumDate, mode) : undefined}
          max={maximumDate ? toInputValue(maximumDate, mode) : undefined}
          disabled={disabled}
          aria-label={label ?? 'Select date'}
          onChange={handleChange}
          onClick={openPicker}
          style={{...overlayStyle, cursor: disabled ? 'default' : 'pointer'}}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  label: {
    flexShrink: 1,
  },
  pill: {
    position: 'relative',
    flexShrink: 0,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: colors.pillBackground,
  },
  value: {
    flexShrink: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});

const overlayStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  opacity: 0,
  appearance: 'none',
};
