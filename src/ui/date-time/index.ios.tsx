import type {DateTimeMode, DateTimePickerProps} from './types';
import type {DatePickerComponent} from '@expo/ui/swift-ui';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {DatePicker} from '@expo/ui/swift-ui';
import {datePickerStyle, tint, disabled as disabledMod} from '@expo/ui/swift-ui/modifiers';
import {useDateValue} from './shared';

export * from './types';

/**
 * iOS renders the picker inline using SwiftUI's compact `DatePicker`, which is
 * exactly the rounded-pill row look the other platforms emulate. Drop it
 * straight into a `FieldGroup.Section` alongside other rows.
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
}: DateTimePickerProps) {
  const [current, setValue] = useDateValue(value, onChange);
  const modifiers: ViewModifier[] = [datePickerStyle('compact')];

  if (accentColor) modifiers.push(tint(accentColor));
  if (disabled != null) modifiers.push(disabledMod(disabled));

  return (
    <DatePicker
      title={label}
      selection={current}
      onDateChange={setValue}
      displayedComponents={modeToComponents(mode)}
      range={minimumDate || maximumDate ? {start: minimumDate, end: maximumDate} : undefined}
      modifiers={modifiers}
      testID={testID}
    />
  );
}

function modeToComponents(mode: DateTimeMode): DatePickerComponent[] {
  switch (mode) {
    case 'time':
      return ['hourAndMinute'];
    case 'datetime':
      return ['date', 'hourAndMinute'];
    case 'date':
    default:
      return ['date'];
  }
}
