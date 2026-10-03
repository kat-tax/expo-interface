import type {Animated as AnimatedType} from 'react-native';
import {useCallback, useState} from 'react';
import {Animated, Easing, Platform} from 'react-native';

/**
 * The fab slot's lift above a toast: a toast under the screen reports what
 * it covers of the bottom edge (`ToastInsetContext`), and the slot moves up
 * by that much and back down as it goes, animated the way Material's
 * scaffold moves its button for a snackbar.
 */
export function useToastLift(): {
  report: (height: number) => void;
  style: {transform: [{translateY: AnimatedType.Value}]};
} {
  const [lift] = useState(() => new Animated.Value(0));
  const report = useCallback((height: number) => {
    Animated.timing(lift, {
      toValue: -height,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      // A transform, which the native driver can run; react-native-web has no
      // native driver and warns when asked for one.
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [lift]);
  return {report, style: {transform: [{translateY: lift}]}};
}
