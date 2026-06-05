import type {SwitchProps} from './types';

import {Switch as RNSwitch, StyleSheet, useColorScheme, View} from 'react-native';
import {Label} from '@/components/ui/typography';

export * from './types';

/** iOS system green — the default "on" track color, matching the iOS Toggle. */
const IOS_GREEN = '#34C759';
/** iOS switches use a white thumb in both states; web defaults to a green thumb. */
const THUMB = '#ffffff';

/**
 * On web the row mirrors the native iOS/Android layout: a label on the leading
 * edge and the native React Native Web switch pinned to the trailing edge.
 *
 * React Native Web defaults to a Material teal-green thumb/track; these colors
 * override it to match the native platforms — a neutral white thumb with a
 * green (or `accentColor`) track when on and a neutral gray track when off.
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
  const isDark = useColorScheme() === 'dark';
  const onColor = accentColor ?? IOS_GREEN;
  const offColor = isDark ? '#39393d' : '#e9e9ea';

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
