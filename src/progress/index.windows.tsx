import type {ProgressProps} from './types';
import {StyleSheet} from 'react-native';
import XamlProgress from '../windows/specs/ExpoInterfaceProgressNativeComponent';
import {useXamlProps} from '../windows';

/**
 * Windows renders the WinUI 3 `ProgressBar` (linear) or `ProgressRing`
 * (circular) in a XAML island. Without a `value` the bar runs its
 * indeterminate dots and the ring spins. The fill takes the accent seed.
 */
export function Progress({value, variant = 'linear', size = 24, color, trackColor, testID}: ProgressProps) {
  const xaml = useXamlProps();
  return (
    <XamlProgress
      variant={variant}
      value={value == null ? -1 : Math.max(0, Math.min(1, value))}
      size={size}
      color={color}
      trackColor={trackColor}
      style={variant === 'linear' ? styles.bar : styles.ring}
      testID={testID}
      {...xaml}
    />
  );
}

const styles = StyleSheet.create({
  // A bar is as wide as its container; the island reports its height.
  bar: {alignSelf: 'stretch'},
  // A ring is its own size, which the island reports.
  ring: {alignSelf: 'flex-start'},
});
