import type {RefObject} from 'react';
import type {KeyboardEvent, View} from 'react-native';
import {useEffect, useState} from 'react';
import {Keyboard, Platform} from 'react-native';

/**
 * How much of a view the keyboard covers, in points: zero while it is down
 * or clear of the view. For a view the kit does not lay out itself (an
 * editor, a canvas) that has to keep what is typed in sight.
 *
 * iOS, Android and Windows read the keyboard's top edge from React Native's
 * keyboard events (iOS's as the frame starts to change, so the answer
 * arrives with the keyboard; Windows' from the touch keyboard, which
 * `expo-windows` raises them for), and measure the view in the window
 * against it. Web reads the visual viewport (`index.web.ts`).
 */
export function useKeyboardInset(ref: RefObject<View | null>): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const show = (event: KeyboardEvent) => {
      const top = event.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _width, height) => setInset(Math.max(0, Math.round(y + height - top))));
    };
    const hide = () => setInset(0);
    const ios = Platform.OS === 'ios';
    const subscriptions = [
      Keyboard.addListener(ios ? 'keyboardWillChangeFrame' : 'keyboardDidShow', show),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', hide),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.remove();
    };
  }, [ref]);
  return inset;
}
