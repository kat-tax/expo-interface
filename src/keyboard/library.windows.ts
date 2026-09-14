import type {KeyboardLibrary} from './types';

/**
 * Windows: nothing is loaded. A desktop has no soft keyboard to ride, and
 * `react-native-keyboard-controller` has no Windows implementation to load;
 * `KeyboardBar` is a plain view there, as on web.
 */
export function loadKeyboardController(): KeyboardLibrary | null {
  return null;
}
