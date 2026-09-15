import type {IconToken} from '../icons';
import {useAccentSeed} from '../accent';
import {useColorScheme} from '../scheme';
import {windowsGlyph} from '../symbol/segoe';

/**
 * What every XAML-hosted control takes from the kit: the accent seed and the
 * scheme, as the `accentColor` and `theme` props of its native component.
 *
 * The scheme is always given explicitly rather than left to `system`, so a
 * scheme forced with `setColorScheme` reaches the XAML tree — WinUI would
 * otherwise follow the OS alone.
 */
export function useXamlProps(): {accentColor: string; theme: 'light' | 'dark'} {
  const accentColor = useAccentSeed();
  const theme = useColorScheme();
  return {accentColor, theme};
}

/** The glyph prop of an icon token, or `undefined` for a token with none. */
export function glyphOf(icon: IconToken | undefined): string | undefined {
  return icon ? windowsGlyph(icon) : undefined;
}

/**
 * Serializes a list for a native component's JSON prop. Functions are
 * dropped on the way (`onPress` handlers stay on the JavaScript side and
 * are looked up by index when the native side reports a pick).
 */
export function jsonProp(items: readonly unknown[]): string {
  return JSON.stringify(items);
}

/** A key event as react-native-windows reports it: `key` and `code` carry the DOM `KeyboardEvent` names. */
export interface KeyEvent {
  nativeEvent: {
    key: string;
    code: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
  };
}

/**
 * react-native-windows' keyboard props for a view, which React Native's own
 * prop types do not carry; spread the result onto a `Pressable` or `View`.
 * Typed as a bare object so the spread adds nothing the checker knows and
 * contradicts nothing it does.
 */
export function keyHandlers(handlers: {onKeyDown?: (event: KeyEvent) => void; onKeyUp?: (event: KeyEvent) => void}): object {
  return handlers;
}
