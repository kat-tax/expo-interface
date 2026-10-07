import type {ChangeEvent, CSSProperties, MouseEvent} from 'react';
import type {DateTimePickerProps} from './types';

import {useLayoutEffect, useRef} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Label} from '../typography';
import {theme} from '../theme';
import {formatValue, inputType, parseInputValue, toDate, toInputValue, useDateValue} from './shared';

/**
 * On web the row mirrors the native iOS/Android pill: a label on the leading
 * edge and a rounded pill showing the value, with a transparent native
 * `<input>` layered on top. Clicking the pill opens the browser's built-in
 * date/time picker. Presented, there is no pill: the input is laid over the
 * chip, unseen, and its picker opened from there.
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
  const [current, setValue] = useDateValue(value, onChange);
  const minimum = toDate(minimumDate);
  const maximum = toDate(maximumDate);

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
        {/* Label-colored value — iOS's compact DatePicker pill uses the
            primary label color (unlike the menu Picker's gray value). */}
        <Label
          color="label"
          style={[styles.value, accentColor != null && {color: accentColor}]}>
          {formatValue(current, mode)}
        </Label>
        <input
          type={inputType(mode)}
          value={toInputValue(current, mode)}
          min={minimum ? toInputValue(minimum, mode) : undefined}
          max={maximum ? toInputValue(maximum, mode) : undefined}
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

/**
 * The browser's own picker, opened from an unseen input laid over the chip
 * so the picker opens there. `showPicker()` needs the press that presented
 * it to be recent; where the browser refuses, the input takes the focus
 * instead and the keyboard edits it. A day picked in `date` mode closes it;
 * otherwise the focus leaving it, or Escape, does.
 */
function PresentedPicker({
  label,
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  presented = false,
  at,
  onDismiss,
  testID,
}: DateTimePickerProps) {
  const [current, setValue] = useDateValue(value, onChange);
  const input = useRef<HTMLInputElement>(null);
  const minimum = toDate(minimumDate);
  const maximum = toDate(maximumDate);

  useLayoutEffect(() => {
    if (!presented) return;
    // The input is in the DOM by the time a layout effect runs.
    const element = input.current!;
    element.focus({preventScroll: true});
    try {
      element.showPicker();
    } catch {
      // No recent press to open it with: the focused input is the picker.
    }
  }, [presented]);

  return (
    <input
      ref={input}
      type={inputType(mode)}
      value={toInputValue(current, mode)}
      min={minimum ? toInputValue(minimum, mode) : undefined}
      max={maximum ? toInputValue(maximum, mode) : undefined}
      aria-label={label ?? 'Select date'}
      tabIndex={presented ? 0 : -1}
      data-testid={testID}
      onChange={event => {
        const next = parseInputValue(event.target.value, mode, current);
        if (next) setValue(next);
        if (presented && mode === 'date') onDismiss?.();
      }}
      onBlur={() => {
        if (presented) onDismiss?.();
      }}
      onKeyDown={event => {
        if (presented && event.key === 'Escape') onDismiss?.();
      }}
      style={{
        ...presentedStyle,
        left: at?.x ?? 0,
        top: at?.y ?? 0,
        width: Math.max(1, at?.width ?? 0),
        height: Math.max(1, at?.height ?? 0),
      }}
    />
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
    backgroundColor: theme.pillBackground,
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
  opacity: 0,
  appearance: 'none',
  // The native picker popup derives its colors from the input's own
  // background/color (not `:root`), so theme them via CSS vars. `opacity: 0`
  // keeps the overlay box invisible; the popup still uses these colors.
  colorScheme: 'light dark',
  color: 'var(--color-label)',
  background: 'var(--color-background)',
};

/** The presented picker's input: over the chip, unseen, taking no presses meant for the chip. */
const presentedStyle: CSSProperties = {
  ...overlayStyle,
  right: 'auto',
  bottom: 'auto',
  pointerEvents: 'none',
};
