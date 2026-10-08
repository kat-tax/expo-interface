import type {DateTimePickerProps} from './types';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import XamlDateFlyout from '../windows/specs/ExpoInterfaceDateFlyoutNativeComponent';
import XamlDatePicker from '../windows/specs/ExpoInterfaceDatePickerNativeComponent';
import XamlTimePicker from '../windows/specs/ExpoInterfaceTimePickerNativeComponent';
import {useXamlProps} from '../windows';
import {Label} from '../typography';
import {dayOf, parseDay, toDate, useDateValue, withDatePart, withTimePart} from './shared';

const pad = (n: number) => String(n).padStart(2, '0');

/** A local time as the `HH:MM` the island takes. */
export function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Parses the island's `YYYY-MM-DD` onto `base`, keeping the time; `null` for
 * none, and for what names no day the calendar has.
 */
export function parseDateString(raw: string, base: Date): Date | null {
  const day = parseDay(raw);
  return day ? withDatePart(base, day) : null;
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
 * other's. Presented, there is no row: the calendar or the time opens in a
 * flyout at the chip.
 */
export function DateTimePicker(props: DateTimePickerProps) {
  if (props.presented !== undefined) return <PresentedPicker {...props}/>;
  return <RowPicker {...props}/>;
}

function RowPicker({
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
  const minimum = toDate(minimumDate);
  const maximum = toDate(maximumDate);
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
            date={dayOf(current)}
            minDate={minimum ? dayOf(minimum) : ''}
            maxDate={maximum ? dayOf(maximum) : ''}
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

/**
 * The calendar in a flyout at the chip, then the time for `datetime`, from a
 * one-point island at the parent's origin. A day picked in `date` mode
 * closes it, and so does a time; a light dismiss after a day was picked on
 * the way to the time keeps the day.
 */
function PresentedPicker({
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  accentColor,
  presented = false,
  at,
  onDismiss,
  testID,
}: DateTimePickerProps) {
  const xaml = useXamlProps();
  const [current, setValue] = useDateValue(value, onChange);
  const first = mode === 'time' ? 'time' : 'date';
  const [shown, setShown] = useState(false);
  const [stage, setStage] = useState<'date' | 'time'>(first);
  const [draft, setDraft] = useState<Date | null>(null);
  if (presented !== shown) {
    setShown(presented);
    if (presented) {
      setStage(first);
      setDraft(null);
    }
  }
  const minimum = toDate(minimumDate);
  const maximum = toDate(maximumDate);
  const shownValue = draft ?? current;
  return (
    <XamlDateFlyout
      open={presented}
      mode={stage}
      date={dayOf(shownValue)}
      time={toTimeString(shownValue)}
      minDate={minimum ? dayOf(minimum) : ''}
      maxDate={maximum ? dayOf(maximum) : ''}
      x={at?.x ?? 0}
      y={(at?.y ?? 0) + (at?.height ?? 0)}
      onDateChange={event => {
        const next = parseDateString(event.nativeEvent.date, current);
        if (!next) return;
        if (mode === 'datetime') {
          setDraft(next);
          setStage('time');
          return;
        }
        setValue(next);
        onDismiss?.();
      }}
      onTimeChange={event => {
        const next = parseTimeString(event.nativeEvent.time, shownValue);
        if (next) setValue(next);
        onDismiss?.();
      }}
      onOpenChange={event => {
        // A close after the app stopped presenting it is the app's own.
        if (event.nativeEvent.open || !presented) return;
        if (draft) setValue(draft);
        onDismiss?.();
      }}
      style={styles.flyout}
      testID={testID}
      {...xaml}
      accentColor={accentColor ?? xaml.accentColor}
    />
  );
}

const styles = StyleSheet.create({
  flyout: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    pointerEvents: 'none',
  },
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
