import type {PropsWithChildren} from 'react';
import type {View} from 'react-native';
import type {KeyboardLibrary, KeyboardState} from './types';
import {createElement, Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {Animated, DeviceEventEmitter, Easing} from 'react-native';

// A `.ts` file, like `library.native.ts` beside it: Metro tries every
// extension before every platform, so a `.windows.tsx` would lose to it.

/** What `keyboardDidShow` carries, as React Native's `Keyboard` reports it: the keyboard's rectangle in the window. */
interface KeyboardEvent {
  endCoordinates: {screenY: number; height: number};
}

/** The keyboard as it stands, with the top edge it covers from, for every bar to read. */
interface WindowsKeyboardState extends KeyboardState {
  top: number;
}

let state: WindowsKeyboardState = {isVisible: false, height: 0, top: 0};
const listeners = new Set<() => void>();
let source: {remove(): void}[] = [];

function publish(next: WindowsKeyboardState) {
  state = next;
  for (const listener of listeners) listener();
}

/** Follows React Native's keyboard events while anything reads the keyboard; nothing fires without `expo-windows`. */
function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    source = [
      DeviceEventEmitter.addListener('keyboardDidShow', (event: KeyboardEvent) => {
        publish({isVisible: true, height: event.endCoordinates.height, top: event.endCoordinates.screenY});
      }),
      DeviceEventEmitter.addListener('keyboardDidHide', () => {
        publish({isVisible: false, height: 0, top: 0});
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

function snapshot(): WindowsKeyboardState {
  return state;
}

function useKeyboardState<T>(selector: (keyboard: KeyboardState) => T): T {
  return selector(useSyncExternalStore(subscribe, snapshot, snapshot));
}

type StickyProps = PropsWithChildren<{offset?: {closed?: number; opened?: number}}>;

/**
 * Rides up to meet the keyboard and rests at `offset.closed`. The view
 * measures its own bottom edge in the window when it is laid out, and the
 * keyboard reports where its top is, so the two meet whatever the window's
 * height has become since — `useWindowDimensions` never updates on a resize
 * here. Before a measurement it rides up by the keyboard's height, less
 * `offset.opened`, what the caller measured under it.
 */
function KeyboardStickyView({children, offset}: StickyProps) {
  const keyboard = useSyncExternalStore(subscribe, snapshot, snapshot);
  const height = keyboard.isVisible ? keyboard.height : 0;
  const closed = offset?.closed ?? 0;
  const opened = offset?.opened ?? 0;
  const [translate] = useState(() => new Animated.Value(closed));
  const view = useRef<View | null>(null);
  const attach = useCallback((node: View | null) => {
    view.current = node;
  }, []);
  /** The view's bottom edge in the window at rest, once measured. */
  const rest = useRef<number | null>(null);
  /** The translation the view is at: the last one it was sent to. */
  const current = useRef(closed);
  const onLayout = useCallback(() => {
    const at = current.current;
    view.current?.measureInWindow((_x, y, _width, h) => {
      rest.current = y + h - at;
    });
  }, []);
  useEffect(() => {
    const toValue = height > 0 ? (rest.current === null ? opened - height : keyboard.top - rest.current) : closed;
    current.current = toValue;
    Animated.timing(translate, {
      toValue,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [height, keyboard.top, opened, closed, translate]);
  return createElement(
    Animated.View,
    // eslint-disable-next-line react/refs -- a callback ref is handed over, no ref is read.
    {ref: attach, onLayout, style: {transform: [{translateY: translate}]}, testID: 'keyboard-sticky'},
    children,
  );
}

/**
 * Windows: the kit's own keyboard library, on React Native's keyboard
 * events. `expo-windows` raises `keyboardDidShow` and `keyboardDidHide`
 * from the window's input pane — the touch keyboard, on a tablet or a
 * touch screen — with the rectangle it covers, so `KeyboardBar` rides up to
 * meet it there; without the runtime no event fires and the bar stays put.
 */
const library: KeyboardLibrary = {
  KeyboardProvider: Fragment,
  KeyboardStickyView,
  useKeyboardState,
};

export function loadKeyboardController(): KeyboardLibrary | null {
  return library;
}
