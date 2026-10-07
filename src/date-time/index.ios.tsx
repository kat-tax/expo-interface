import type {DateTimeMode, DateTimePickerProps} from './types';
import type {DatePickerComponent} from '@expo/ui/swift-ui';
import type {ViewModifier} from '@expo/ui/swift-ui/modifiers';

import {StyleSheet} from 'react-native';
import {DatePicker, Popover, Spacer} from '@expo/ui/swift-ui';
import {datePickerStyle, tint, disabled as disabledMod, frame, padding} from '@expo/ui/swift-ui/modifiers';
import {NativeHost, useNativeHost} from '../host';
import {toDate, useDateValue} from './shared';

/**
 * iOS renders the picker inline using SwiftUI's compact `DatePicker`, which is
 * exactly the rounded-pill row look the other platforms emulate. Drop it
 * straight into a `FieldGroup.Section` alongside other rows. Presented, it
 * is a popover from the chip instead.
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
  const modifiers: ViewModifier[] = [datePickerStyle('compact')];

  if (accentColor) modifiers.push(tint(accentColor));
  if (disabled != null) modifiers.push(disabledMod(disabled));

  return (
    <DatePicker
      title={label}
      selection={current}
      onDateChange={setValue}
      displayedComponents={modeToComponents(mode)}
      range={rangeOf(minimumDate, maximumDate)}
      modifiers={modifiers}
      testID={testID}
    />
  );
}

/**
 * A SwiftUI `popover` from a point at the chip's bottom edge — the
 * presentation an iPad and a phone both give a calendar there, kept a
 * popover on a phone by `presentationCompactAdaptation` — holding the
 * graphical calendar for a date and the wheels for a time. A day picked in
 * `date` mode closes it; a time is set by turning the wheels, and the
 * popover closes as any does, by a tap outside it.
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
  const hosted = useNativeHost();
  const [current, setValue] = useDateValue(value, onChange);
  const modifiers: ViewModifier[] = [datePickerStyle(mode === 'time' ? 'wheel' : 'graphical'), padding({all: 12})];
  if (accentColor) modifiers.push(tint(accentColor));
  const popover = (
    <Popover
      isPresented={presented}
      arrowEdge="top"
      onIsPresentedChange={open => {
        if (!open) onDismiss?.();
      }}
      testID={testID}>
      <Popover.Trigger>
        <Spacer modifiers={[frame({width: 1, height: 1})]}/>
      </Popover.Trigger>
      <Popover.Content>
        <DatePicker
          selection={current}
          onDateChange={next => {
            setValue(next);
            if (mode === 'date') onDismiss?.();
          }}
          displayedComponents={modeToComponents(mode)}
          range={rangeOf(minimumDate, maximumDate)}
          modifiers={modifiers}
        />
      </Popover.Content>
    </Popover>
  );
  // Inside a host the popover is presented from where it sits; over React
  // Native content it is laid at the chip in a host of its own.
  if (hosted) return popover;
  return (
    <NativeHost
      fit
      pointerEvents="box-none"
      style={[styles.anchor, {left: at?.x ?? 0, top: (at?.y ?? 0) + (at?.height ?? 0)}]}>
      {popover}
    </NativeHost>
  );
}

function rangeOf(minimumDate: DateTimePickerProps['minimumDate'], maximumDate: DateTimePickerProps['maximumDate']) {
  return minimumDate || maximumDate ? {start: toDate(minimumDate), end: toDate(maximumDate)} : undefined;
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

const styles = StyleSheet.create({
  anchor: {position: 'absolute'},
});
