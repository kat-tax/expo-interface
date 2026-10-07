import type {Animated as AnimatedType} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Platform} from 'react-native';

/**
 * The fab slot's lift above a toast: a toast under the screen reports what
 * it covers of the bottom edge (`ToastInsetContext`), and so does the app's
 * toast (`app`, from a `ToastProvider`); the slot moves up by the larger and
 * back down as they go, animated the way Material's scaffold moves its
 * button for a snackbar.
 */
export function useToastLift(app = 0): {
  report: (height: number) => void;
  style: {transform: [{translateY: AnimatedType.Value}]};
} {
  const [lift] = useState(() => new Animated.Value(0));
  const [own, setOwn] = useState(0);
  const height = Math.max(own, app);
  const moved = useRef(0);
  useEffect(() => {
    if (moved.current === height) return;
    moved.current = height;
    Animated.timing(lift, {
      toValue: -height,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      // A transform, which the native driver can run; react-native-web has no
      // native driver and warns when asked for one.
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [lift, height]);
  return {report: setOwn, style: {transform: [{translateY: lift}]}};
}
