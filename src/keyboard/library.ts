import type {KeyboardLibrary} from './types';

/**
 * Web (and any platform without a native keyboard): nothing is loaded. The
 * browser keeps the page above the keyboard itself, and
 * `react-native-keyboard-controller` must never reach the web bundle: it is
 * built on Reanimated, whose server render (the static export) calls
 * `requestAnimationFrame` and dies. `library.native.ts` loads it natively.
 */
export function loadKeyboardController(): KeyboardLibrary | null {
  return null;
}
