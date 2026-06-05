import type {SwitchProps} from './types';

import {Switch as RNSwitch, StyleSheet, View} from 'react-native';
import {Label} from '@/components/ui/typography';

export * from './types';

/**
 * On web the row mirrors the native iOS/Android layout: a label on the leading
 * edge and the native React Native Web switch pinned to the trailing edge.
 * `accentColor` tints the "on" track to match the other platforms.
 */
export function Switch({
  label,
  value,
  onValueChange,
  disabled,
  accentColor,
  testID,
  style,
}: SwitchProps) {
  const toggle = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={accentColor ? {true: accentColor} : undefined}
      testID={label == null ? testID : undefined}
    />
  );
  return label === null ? toggle : (
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
