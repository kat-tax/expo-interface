import {useEffect, useState} from 'react';
import {Animated, Easing, Platform} from 'react-native';
import {useReducedMotion} from '../motion';

/** Half a pulse, in milliseconds: down to the low point, or back up. */
export const PULSE_HALF = 450;

/** How far down a pulse goes. */
export const PULSE_LOW = 0.35;

/**
 * A drawn badge's opacity while it pulses: down and back up every
 * `2 × PULSE_HALF`, for as long as `active` and the user has not asked for
 * less motion; fully opaque otherwise. On the native driver where there is
 * one.
 */
export function usePulseOpacity(active: boolean): Animated.Value {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!active || reduced) return undefined;
    const native = Platform.OS === 'ios' || Platform.OS === 'android';
    const half = (toValue: number) => Animated.timing(opacity, {toValue, duration: PULSE_HALF, easing: Easing.inOut(Easing.ease), useNativeDriver: native});
    const loop = Animated.loop(Animated.sequence([half(PULSE_LOW), half(1)]));
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [active, reduced, opacity]);
  return opacity;
}

/**
 * Android: which end of the pulse the badge is heading for, flipped every
 * `PULSE_HALF` while `active`, for Compose to animate the alpha toward. Up,
 * and still, under reduced motion.
 */
export function usePulsePhase(active: boolean): 'low' | 'high' {
  const reduced = useReducedMotion();
  const [low, setLow] = useState(false);
  useEffect(() => {
    if (!active || reduced) return undefined;
    const timer = setInterval(() => setLow(previous => !previous), PULSE_HALF);
    return () => clearInterval(timer);
  }, [active, reduced]);
  return active && !reduced && low ? 'low' : 'high';
}
