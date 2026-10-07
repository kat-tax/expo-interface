import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';

/**
 * Whether the user asked for less motion (iOS's Reduce Motion, Android's
 * Remove Animations, the browser's `prefers-reduced-motion`), followed as it
 * changes. A loop that only decorates (a pulse) stops while it is on.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (live) setReduced(value);
    }, () => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      live = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
