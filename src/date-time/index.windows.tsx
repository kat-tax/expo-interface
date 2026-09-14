import type {DateTimePickerProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlDatePicker from '../windows/specs/ExpoInterfaceDatePickerNativeComponent';
import XamlTimePicker from '../windows/specs/ExpoInterfaceTimePickerNativeComponent';
import {useXamlProps} from '../windows';
import {Label} from '../typography';
import {useDateValue, withDatePart, withTimePart} from './shared';

const pad = (n: number) => String(n).padStart(2, '0');

/** A local calendar day as the `YYYY-MM-DD` the island takes. */
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A local time as the `HH:MM` the island takes. */
export function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses the island's `YYYY-MM-DD` onto `base`, keeping the time; `null` for none. */
export function parseDateString(raw: string, base: Date): Date | null {
  const [year, month, day] = raw.split('-').map(Number);
  if (!raw || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  const picked = new Date(base);
  picked.setFullYear(year, month - 1, day);
  return withDatePart(base, picked);
}

/** Parses the island's `HH:MM` onto `base`, keeping the day; `null` for malformed. */
export function parseTimeString(raw: string, base: Date): Date | null {
  const [hours, minutes] = raw.split(':').map(Number);
  if (!raw || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const picked = new Date(base);
  picked.setHours(hours, minutes, 0, 0);
  return withTimePart(base, picked);
}

/**
 * Windows renders the WinUI 3 `CalendarDatePicker` (a field that opens a
 * calendar flyout) and `TimePicker` (a field that opens a time flyout) in
 * XAML islands, one or both by `mode`, at the trailing edge of a row whose
 * label the kit draws. Each edits its own part of the value and keeps the
 * other's.
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
  const xaml = useXamlProps();
  const [current, setValue] = useDateValue(value, onChange);
  const shared = {...xaml, accentColor: accentColor ?? xaml.accentColor, disabled, label};
  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <View style={styles.controls}>
        {mode !== 'time' ? (
          <XamlDatePicker
            date={toDateString(current)}
            minDate={minimumDate ? toDateString(minimumDate) : ''}
            maxDate={maximumDate ? toDateString(maximumDate) : ''}
            onDateChange={event => {
              const next = parseDateString(event.nativeEvent.date, current);
              if (next) setValue(next);
            }}
            {...shared}
          />
        ) : null}
        {mode !== 'date' ? (
          <XamlTimePicker
            time={toTimeString(current)}
            onTimeChange={event => {
              const next = parseTimeString(event.nativeEvent.time, current);
              if (next) setValue(next);
            }}
            {...shared}
          />
        ) : null}
      </View>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});
