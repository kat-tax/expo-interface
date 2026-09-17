import type {PropsWithChildren} from 'react';
import type {KeyboardLibrary, KeyboardState} from './types';
import {createElement, Fragment, useEffect, useState, useSyncExternalStore} from 'react';
import {Animated, DeviceEventEmitter, Easing} from 'react-native';

// A `.ts` file, like `library.native.ts` beside it: Metro tries every
// extension before every platform, so a `.windows.tsx` would lose to it.

/** What `keyboardDidShow` carries, as React Native's `Keyboard` reports it. */
interface KeyboardEvent {
  endCoordinates: {height: number};
}

/** The keyboard as it stands, for every bar to read. */
let state: KeyboardState = {isVisible: false, height: 0};
const listeners = new Set<() => void>();
let source: {remove(): void}[] = [];

function publish(next: KeyboardState) {
  state = next;
  for (const listener of listeners) listener();
}

/** Follows React Native's keyboard events while anything reads the keyboard; nothing fires without `expo-windows`. */
function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    source = [
      DeviceEventEmitter.addListener('keyboardDidShow', (event: KeyboardEvent) => {
        publish({isVisible: true, height: event.endCoordinates.height});
      }),
      DeviceEventEmitter.addListener('keyboardDidHide', () => {
        publish({isVisible: false, height: 0});
      }),
    ];
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      for (const subscription of source) subscription.remove();
      source = [];
    }
  };
}

function snapshot(): KeyboardState {
  return state;
}

function useKeyboardState<T>(selector: (keyboard: KeyboardState) => T): T {
  return selector(useSyncExternalStore(subscribe, snapshot, snapshot));
}

type StickyProps = PropsWithChildren<{offset?: {closed?: number; opened?: number}}>;

/** Rides up on the keyboard by its height, less `offset.opened` — what lies under the view — and rests at `offset.closed`. */
function KeyboardStickyView({children, offset}: StickyProps) {
  const height = useKeyboardState(keyboard => (keyboard.isVisible ? keyboard.height : 0));
  const closed = offset?.closed ?? 0;
  const opened = offset?.opened ?? 0;
  const [translate] = useState(() => new Animated.Value(closed));
  useEffect(() => {
    Animated.timing(translate, {
      toValue: height > 0 ? opened - height : closed,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [height, opened, closed, translate]);
  return createElement(Animated.View, {style: {transform: [{translateY: translate}]}}, children);
}

/**
 * Windows: the kit's own keyboard library, on React Native's keyboard
 * events. `expo-windows` raises `keyboardDidShow` and `keyboardDidHide`
 * from the window's input pane — the touch keyboard, on a tablet or a
 * touch screen — with the height it covers, so `KeyboardBar` rides up on it
 * there; without the runtime no event fires and the bar stays put.
 */
const library: KeyboardLibrary = {
  KeyboardProvider: Fragment,
  KeyboardStickyView,
  useKeyboardState,
};

export function loadKeyboardController(): KeyboardLibrary | null {
  return library;
}
