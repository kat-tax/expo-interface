import type {StepperProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlNumberBox from '../windows/specs/ExpoInterfaceNumberBoxNativeComponent';
import {useXamlProps} from '../windows';
import {Label} from '../typography';
import {clampStep} from './shared';

/**
 * Windows renders a WinUI 3 `NumberBox` with inline spin buttons in a XAML
 * island — Fluent's stepper, which also takes a typed value — at the
 * trailing edge of a row whose label the kit draws. The control keeps the
 * value inside `min`/`max` itself; `formatValue` is not applied, as on iOS,
 * since the box shows the number it edits.
 */
export function Stepper({label, value, onValueChange, step = 1, min, max, disabled, testID, style}: StepperProps) {
  const xaml = useXamlProps();
  return (
    <View style={[styles.row, style]} testID={testID}>
      {label != null ? (
        <Label color="label" style={[styles.label, disabled && styles.disabled]}>
          {label}
        </Label>
      ) : null}
      <XamlNumberBox
        value={value}
        step={step}
        hasMin={min != null}
        min={min ?? 0}
        hasMax={max != null}
        max={max ?? 0}
        disabled={disabled}
        label={label}
        onValueChange={event => onValueChange(clampStep(event.nativeEvent.value, min, max))}
        {...xaml}
      />
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
  disabled: {
    opacity: 0.4,
  },
});
