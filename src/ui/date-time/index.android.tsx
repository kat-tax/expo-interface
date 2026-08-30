import type {DateTimePickerProps} from './types';

import {useState} from 'react';
import {useMaterialColors, Row, Text, Column, DatePickerDialog, TimePickerDialog} from '@expo/ui/jetpack-compose';
import {clip, Shapes, padding, clickable, background, fillMaxWidth} from '@expo/ui/jetpack-compose/modifiers';
import {useColor} from '@/ui/theme';
import {formatValue, useDateValue, withDatePart, withTimePart} from './shared';

/**
 * Android has no inline date+time control, so the row shows the same iOS-style
 * pill as web — built with Jetpack Compose primitives so it lives natively
 * inside the surrounding `Host`/`FieldGroup`. Pressing the pill opens a
 * Material date dialog and then, for `datetime` mode, a time dialog. Each
 * dialog mounts on demand and unmounts once it reports a value or is dismissed.
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
}: DateTimePickerProps) {
  const [current, setValue] = useDateValue(value, onChange);
  const [stage, setStage] = useState<'idle' | 'date' | 'time'>('idle');
  const [draft, setDraft] = useState<Date | null>(null);
  const colors = useMaterialColors();
  const tint = useColor('tint');
  // The dialogs are tinted with the live accent seed by default so they
  // follow a user-supplied accent even when the native host is not seeded.
  const dialogColor = accentColor ?? tint;
  const labelColor = disabled ? colors.onSurfaceVariant : colors.onSurface;
  const valueColor = disabled ? colors.onSurfaceVariant : (accentColor ?? colors.onSurface);
  const selectableDates = minimumDate || maximumDate ? {start: minimumDate, end: maximumDate} : undefined;

  const open = () => {
    setStage(mode === 'time' ? 'time' : 'date');
  };

  const handleDate = (picked: Date) => {
    const next = withDatePart(current, picked);
    if (mode === 'datetime') {
      setDraft(next);
      setStage('time');
    } else {
      setValue(next);
      setStage('idle');
    }
  };

  const handleTime = (picked: Date) => {
    setValue(withTimePart(draft ?? current, picked));
    setDraft(null);
    setStage('idle');
  };

  const dismissDate = () => {
    setStage('idle');
  };

  const dismissTime = () => {
    if (draft) {
      setValue(draft);
      setDraft(null);
    }
    setStage('idle');
  };

  return (
    <Column modifiers={[fillMaxWidth()]}>
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
      {stage === 'date' && (
        <DatePickerDialog
          initialDate={(draft ?? current).toISOString()}
          color={dialogColor}
          selectableDates={selectableDates}
          onDateSelected={handleDate}
          onDismissRequest={dismissDate}
        />
      )}
      {stage === 'time' && (
        <TimePickerDialog
          initialDate={(draft ?? current).toISOString()}
          color={dialogColor}
          onDateSelected={handleTime}
          onDismissRequest={dismissTime}
        />
      )}
    </Column>
  );
}
