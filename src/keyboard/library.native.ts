import type {KeyboardLibrary} from './types';

/**
 * iOS and Android: `react-native-keyboard-controller` when the app has it
 * installed (an optional peer), `null` otherwise. The `require` sits in a
 * `try` so Metro treats the dependency as optional and a bundle without the
 * library still builds; `KeyboardBar` and `AccentProvider` then fall back to
 * plain views.
 */
export function loadKeyboardController(): KeyboardLibrary | null {
  try {
    // eslint-disable-next-line typescript/no-require-imports -- optional peer, resolved only when installed.
    return require('react-native-keyboard-controller') as KeyboardLibrary;
  } catch {
    return null;
  }
}
