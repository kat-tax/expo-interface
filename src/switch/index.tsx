import type {SwitchProps} from './types';
import {Switch as RNSwitch, StyleSheet, View} from 'react-native';
import {Label} from '../typography';
import {theme} from '../theme';

/** iOS switches use a white thumb in both states; web defaults to a green thumb. */
const THUMB = '#ffffff';

/**
 * On web the row mirrors the native iOS/Android layout: a label on the leading
 * edge and the native React Native Web switch pinned to the trailing edge.
 * The "on" track defaults to the accent tint for iOS parity — on iOS the
 * Host-level `tint` cascade colors the SwiftUI `Toggle` with the seed.
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
  const onColor = accentColor ?? (theme.tint as string);
  const offColor = theme.switchTrack;
  const toggle = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      thumbColor={THUMB}
      trackColor={{true: onColor, false: offColor}}
      testID={label == null ? testID : undefined}
      {...({activeThumbColor: THUMB} as object)}
    />
  );

  return label != null ? (
    <View style={[styles.row, style]} testID={testID}>
      <Label color="label" style={[styles.label, disabled && styles.disabled]}>
        {label}
      </Label>
      {toggle}
    </View>
  ) : toggle;
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
