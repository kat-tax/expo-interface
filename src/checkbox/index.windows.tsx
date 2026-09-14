import type {CheckboxProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlCheckBox from '../windows/specs/ExpoInterfaceCheckBoxNativeComponent';
import {useXamlProps} from '../windows';
import {Label} from '../typography';

/**
 * Windows renders a WinUI 3 `CheckBox` in a XAML island at the trailing edge
 * of a row whose label the kit draws, mirroring the form row of the other
 * platforms. The checked fill takes the accent seed.
 */
export function Checkbox({label, value, onValueChange, disabled, accentColor, testID, style}: CheckboxProps) {
  const xaml = useXamlProps();
  const box = (
    <XamlCheckBox
      value={value}
      disabled={disabled}
      color={accentColor}
      label={label}
      onValueChange={event => onValueChange(event.nativeEvent.value)}
      testID={label == null ? testID : undefined}
      {...xaml}
    />
  );

  if (label == null) return box;

  return (
    <View style={[styles.row, style]} testID={testID}>
      <Label color="label" style={[styles.label, disabled && styles.disabled]}>
        {label}
      </Label>
      {box}
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
