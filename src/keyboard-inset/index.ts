import type {RefObject} from 'react';
import type {KeyboardEvent, View} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import {Keyboard, Platform} from 'react-native';
import {ridingHeight, subscribeRiding} from '../keyboard/riding';

/**
 * How much of a view the keyboard covers, in points: zero while it is down
 * or clear of the view. For a view the kit does not lay out itself (an
 * editor, a canvas) that has to keep what is typed in sight.
 *
 * A `KeyboardBar` riding on the keyboard over the view counts as well: it
 * covers its own height above the keyboard's top, so a view that reaches
 * into that band is covered by that much more, and one that ends above the
 * band still reads zero. The bar's `onKeyboard` reports the keyboard's
 * height alone.
 *
 * iOS, Android and Windows read the keyboard's top edge from React Native's
 * keyboard events (iOS's as the frame starts to change, so the answer
 * arrives with the keyboard; Windows' from the touch keyboard, which
 * `expo-windows` raises them for), and measure the view in the window
 * against it, again whenever a bar's riding height changes while the
 * keyboard is up. Web reads the visual viewport (`index.web.ts`).
 */
export function useKeyboardInset(ref: RefObject<View | null>): number {
  const [inset, setInset] = useState(0);
  /** The keyboard's top edge in the window while it is up, `null` while it is down. */
  const top = useRef<number | null>(null);
  useEffect(() => {
    const measure = () => {
      if (top.current === null) return;
      const edge = top.current - ridingHeight();
      ref.current?.measureInWindow((_x, y, _width, height) => {
        // The keyboard may have gone while the view was being measured.
        if (top.current === null) return;
        setInset(Math.max(0, Math.round(y + height - edge)));
      });
    };
    const show = (event: KeyboardEvent) => {
      top.current = event.endCoordinates.screenY;
      measure();
    };
    const hide = () => {
      top.current = null;
      setInset(0);
    };
    const ios = Platform.OS === 'ios';
    const subscriptions = [
      Keyboard.addListener(ios ? 'keyboardWillChangeFrame' : 'keyboardDidShow', show),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', hide),
    ];
    const unsubscribe = subscribeRiding(measure);
    return () => {
      for (const subscription of subscriptions) subscription.remove();
      unsubscribe();
    };
  }, [ref]);
  return inset;
}
