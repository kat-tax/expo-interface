import type {SwitchProps} from './types';
import {StyleSheet, View} from 'react-native';
import XamlToggleSwitch from '../windows/specs/ExpoInterfaceToggleSwitchNativeComponent';
import {useXamlProps} from '../windows';
import {Label} from '../typography';

/**
 * Windows renders a WinUI 3 `ToggleSwitch` in a XAML island, pinned to the
 * trailing edge of a row whose label the kit draws — the same row iOS's
 * `Toggle` is and the other platforms mirror. The on state takes the accent
 * seed rather than the system accent, so the switch reads like its twins.
 */
export function Switch({label, value, onValueChange, disabled, accentColor, testID, style}: SwitchProps) {
  const xaml = useXamlProps();
  const toggle = (
    <XamlToggleSwitch
      value={value}
      disabled={disabled}
      color={accentColor}
      onValueChange={event => onValueChange(event.nativeEvent.value)}
      testID={label == null ? testID : undefined}
      accessibilityLabel={label}
      {...xaml}
    />
  );

  if (label == null) return toggle;

  return (
    <View style={[styles.row, style]} testID={testID}>
      <Label color="label" style={[styles.label, disabled && styles.disabled]}>
        {label}
      </Label>
      {toggle}
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
