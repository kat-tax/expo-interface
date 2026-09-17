import type {ViewStyle} from 'react-native';
import {useLayoutEffect, useRef, useState} from 'react';
import {Animated, Easing} from 'react-native';

/** How a screen arrives: WinUI's entrance, a fade alone, or at once. */
export type Entrance = 'default' | 'fade' | 'none';

/** WinUI's entrance and dialog motion: 200 ms, decelerating. */
const DURATION = 200;
/** A card comes up from below by this much; a dialog settles from this scale. */
const CARD_OFFSET = 24;
const DIALOG_SCALE = 1.05;

/**
 * The animated style of a screen arriving: a card slides up from a little
 * below and fades in, as WinUI's pages enter; a dialog settles from a
 * little larger, as a `ContentDialog` opens. It plays when `key` changes —
 * a push, a pop — and, for a dialog, when it mounts; a card on its first
 * mount is simply there, as the first page of a window is. `animation`
 * turns it into a fade or off, as the stack's screen option does.
 */
export function useEntrance(key: string, kind: 'card' | 'dialog', animation: Entrance = 'default'): Animated.WithAnimatedObject<ViewStyle> {
  const [progress] = useState(() => new Animated.Value(1));
  const shown = useRef<string | null>(null);
  useLayoutEffect(() => {
    const first = shown.current === null;
    const same = shown.current === key;
    shown.current = key;
    if (same || animation === 'none' || (first && kind === 'card')) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {toValue: 1, duration: DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: false}).start();
  }, [key, kind, animation, progress]);
  if (animation === 'fade') return {opacity: progress};
  return {
    opacity: progress,
    transform:
      kind === 'card'
        ? [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [CARD_OFFSET, 0]})}]
        : [{scale: progress.interpolate({inputRange: [0, 1], outputRange: [DIALOG_SCALE, 1]})}],
  };
}
