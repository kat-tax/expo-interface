import type {ComponentType, PropsWithChildren} from 'react';

/** What `react-native-keyboard-controller` reports about the keyboard. */
export interface KeyboardState {
  isVisible: boolean;
  /** The keyboard's height from the window's bottom edge. */
  height: number;
}

/**
 * The pieces of `react-native-keyboard-controller` the kit uses. The library
 * is an optional peer: `KeyboardBar` sticks to the keyboard through it when
 * it is installed and is a plain view otherwise (and always on web, where
 * the library's Reanimated cannot render on the server).
 */
export interface KeyboardLibrary {
  KeyboardProvider: ComponentType<PropsWithChildren>;
  KeyboardStickyView: ComponentType<PropsWithChildren<{offset?: {closed?: number; opened?: number}}>>;
  useKeyboardState: <T>(selector: (state: KeyboardState) => T) => T;
}
