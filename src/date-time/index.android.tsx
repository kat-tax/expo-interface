import type {DateTimeMode, DateTimePickerProps} from './types';

import {useState} from 'react';
import {StyleSheet} from 'react-native';
import {useMaterialColors, Row, Text, Column, DatePickerDialog, TimePickerDialog} from '@expo/ui/jetpack-compose';
import {clip, Shapes, padding, clickable, background, fillMaxWidth, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {useColor} from '../theme';
import {formatValue, fromUtcDay, toDate, useDateValue, utcDayOf, withDatePart, withTimePart} from './shared';

/**
 * Android has no inline date+time control, so the row shows the same iOS-style
 * pill as web — built with Jetpack Compose primitives so it lives natively
 * inside the surrounding `Host`/`FieldGroup`. Pressing the pill opens a
 * Material date dialog and then, for `datetime` mode, a time dialog. Each
 * dialog mounts on demand and unmounts once it reports a value or is dismissed.
 * Presented, the dialogs open while `presented` holds, with no row.
 *
 * Material's date dialog keeps its days in UTC: it is handed the local day
 * as midnight UTC and answers the same way, which is read back as the local
 * day. A local instant handed over as it is shows as the day before, west of
 * Greenwich, and an answer read in local time is a day early there.
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
}: DateTimePickerProps) {
  const [current, setValue] = useDateValue(value, onChange);
  const [stage, setStage] = useState<'idle' | 'date' | 'time'>('idle');
  const [draft, setDraft] = useState<Date | null>(null);
  const colors = useMaterialColors();
  const tint = useColor('tint');
  const labelColor = disabled ? colors.onSurfaceVariant : colors.onSurface;
  const valueColor = disabled ? colors.onSurfaceVariant : (accentColor ?? colors.onSurface);

  const open = () => {
    setStage(mode === 'time' ? 'time' : 'date');
  };

  return (
    <Column modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
      <Row
        verticalAlignment="center"
        horizontalArrangement="spaceBetween"
        modifiers={[fillMaxWidth()]}>
        {label != null ? <Text color={labelColor}>{label}</Text> : null}
        <Text
          color={valueColor}
          modifiers={[
            clip(Shapes.RoundedCorner(8)),
            background(colors.surfaceContainerHighest),
            ...(disabled ? [] : [clickable(open)]),
            padding(12, 6, 12, 6),
          ]}>
          {formatValue(current, mode)}
        </Text>
      </Row>
      {stage !== 'idle' ? (
        <PickerDialogs
          stage={stage}
          mode={mode}
          current={current}
          draft={draft}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          color={accentColor ?? tint}
          onDraft={next => {
            setDraft(next);
            setStage('time');
          }}
          onDone={next => {
            if (next) setValue(next);
            setDraft(null);
            setStage('idle');
          }}
        />
      ) : null}
    </Column>
  );
}

/**
 * The dialogs alone, while `presented` holds: the date, then the time for
 * `datetime`, starting over each time the picker is presented again.
 */
function PresentedPicker({
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  accentColor,
  presented = false,
  onDismiss,
}: DateTimePickerProps) {
  const hosted = useNativeHost();
  const [current, setValue] = useDateValue(value, onChange);
  const first = mode === 'time' ? 'time' : 'date';
  const [shown, setShown] = useState(false);
  const [stage, setStage] = useState<'date' | 'time'>(first);
  const [draft, setDraft] = useState<Date | null>(null);
  const tint = useColor('tint');
  if (presented !== shown) {
    setShown(presented);
    if (presented) {
      setStage(first);
      setDraft(null);
    }
  }
  if (!presented) return null;
  const dialogs = (
    <PickerDialogs
      stage={stage}
      mode={mode}
      current={current}
      draft={draft}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      color={accentColor ?? tint}
      onDraft={next => {
        setDraft(next);
        setStage('time');
      }}
      onDone={next => {
        if (next) setValue(next);
        onDismiss?.();
      }}
    />
  );
  // A Compose dialog is a direct child of a host: inside one it is placed as
  // it is, and outside one it gets an empty host of its own, since it is
  // presented in a window of its own.
  if (hosted) return dialogs;
  return (
    <NativeHost style={styles.overlay} pointerEvents="none">
      {dialogs}
    </NativeHost>
  );
}

interface PickerDialogsProps {
  stage: 'date' | 'time';
  mode: DateTimeMode;
  current: Date;
  /** The day picked on the way to the time, in `datetime` mode. */
  draft: Date | null;
  minimumDate: DateTimePickerProps['minimumDate'];
  maximumDate: DateTimePickerProps['maximumDate'];
  /** The dialogs' tint: the live accent seed by default, since the host may not be seeded. */
  color: string;
  /** A day picked on the way to the time. */
  onDraft: (next: Date) => void;
  /** The pick is over: the value to keep, or `null` when there is nothing new. */
  onDone: (next: Date | null) => void;
}

/** The Material dialog for the stage the pick is at. */
function PickerDialogs({stage, mode, current, draft, minimumDate, maximumDate, color, onDraft, onDone}: PickerDialogsProps) {
  const minimum = toDate(minimumDate);
  const maximum = toDate(maximumDate);
  const selectableDates = minimum || maximum
    ? {start: minimum ? utcDayOf(minimum) : undefined, end: maximum ? utcDayOf(maximum) : undefined}
    : undefined;
  if (stage === 'date') {
    return (
      <DatePickerDialog
        initialDate={utcDayOf(draft ?? current).toISOString()}
        color={color}
        selectableDates={selectableDates}
        onDateSelected={picked => {
          const next = withDatePart(current, fromUtcDay(picked));
          if (mode === 'datetime') onDraft(next);
          else onDone(next);
        }}
        onDismissRequest={() => onDone(null)}
      />
    );
  }
  return (
    <TimePickerDialog
      initialDate={(draft ?? current).toISOString()}
      color={color}
      onDateSelected={picked => onDone(withTimePart(draft ?? current, picked))}
      // Dismissing the time after a day was picked keeps the day.
      onDismissRequest={() => onDone(draft)}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {position: 'absolute'},
});
