import type {ViewStyle} from 'react-native';
import type {StackAnimation} from './motion';
import {useLayoutEffect, useState} from 'react';
import {Animated} from 'react-native';
import {DECELERATE, DURATION} from './motion';

/** How a dialog arrives: WinUI's dialog motion, a fade alone, or at once. */
export type Entrance = 'default' | 'fade' | 'none';

/** A dialog settles from this scale, as a `ContentDialog` opens. */
const DIALOG_SCALE = 1.05;

/** The dialog motion a stack animation asks for: a fade is a fade, none is none, anything else is the dialog's own. */
export function dialogEntrance(animation: StackAnimation = 'default'): Entrance {
  if (animation === 'fade' || animation === 'flip') return 'fade';
  if (animation === 'none') return 'none';
  return 'default';
}

/**
 * The animated style of a dialog arriving: it settles from a little larger
 * and fades in, as a `ContentDialog` opens, when it mounts. `animation`
 * turns it into a fade or off, as the stack's screen option does. Cards
 * have `useScreenMotion`, which also sees the screen they replace out.
 */
export function useEntrance(animation: StackAnimation = 'default'): Animated.WithAnimatedObject<ViewStyle> {
  const [progress] = useState(() => new Animated.Value(1));
  const entrance = dialogEntrance(animation);
  useLayoutEffect(() => {
    if (entrance === 'none') {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {toValue: 1, duration: DURATION.arriving, easing: DECELERATE, useNativeDriver: true}).start();
  }, [entrance, progress]);
  if (entrance === 'fade') return {opacity: progress};
  return {
    opacity: progress,
    transform: [{scale: progress.interpolate({inputRange: [0, 1], outputRange: [DIALOG_SCALE, 1]})}],
  };
}
