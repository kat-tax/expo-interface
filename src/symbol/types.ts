import type {IconToken, IconTone} from '../icons';

/**
 * An icon on its own: the kit's glyph drawn from a token on every platform.
 * Decorative, so it stays out of the accessible name of the control around
 * it; a control names itself.
 *
 * On Android it draws natively inside a host (a `ListItem`'s slots, a
 * `NativeHost`, `Screen native`): Compose's `Icon` with the token's
 * drawable, so it can stand at either end of a row, in a `List` as well. A
 * token with no drawable draws nothing there. Outside a host, and on iOS
 * everywhere, it is `expo-symbols`' `SymbolView`, a React Native view. A
 * React Native view of the app's own placed among native content still
 * counts as inside the host, so on Android an `Icon` inside one draws
 * nothing: put the icon in the native content itself.
 */
export interface IconProps {
  /** Icon to draw. Its `fill` picks the solid form. */
  icon: IconToken;
  /**
   * Glyph size in points.
   * @default 24
   */
  size?: number;
  /**
   * The color's role: the label color, the secondary or tertiary text
   * colors, the accent, the success green or the destructive red.
   * @default 'label'
   */
  tone?: IconTone;
  /** A color of its own, which wins over `tone`. */
  tintColor?: string;
  /** Identifier used to locate the glyph in end-to-end tests. */
  testID?: string;
}
