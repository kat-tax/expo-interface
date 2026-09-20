import type {StyleProp, ViewStyle} from 'react-native';

/**
 * A count or a dot beside the thing it is about: unread messages on a tab, a
 * pending upload on a row, an alert on a settings item.
 *
 * The badge stands on its own rather than wrapping what it marks. That is the
 * shape all four platforms can render honestly:
 *
 * - Windows: a WinUI `InfoBadge`, in an island of its own.
 * - Android: the Material 3 Compose `Badge`.
 * - iOS: drawn. SwiftUI's `badge` modifier only paints inside a `List`, a
 *   `TabView` or a toolbar, so a badge anywhere else would silently render
 *   nothing; `ListItem` and `Tabs` are where that modifier belongs.
 * - Web: a `<span>` with the count as its accessible name.
 *
 * **Placing one over a control is the caller's job**, with absolute
 * positioning, as `Screen` floats a `Fab`. On Windows, be careful doing it over
 * something pressable: a XAML island takes pointer input for itself whatever
 * React Native's `pointerEvents` says, so a badge laid over a button swallows
 * presses meant for the button. Put it beside the control, or inside it.
 */
export interface BadgeProps {
  /**
   * The number to show. `0` draws nothing at all, since a count of nothing is
   * not news; pass `showZero` to draw it anyway.
   */
  count?: number;
  /**
   * Counts above this are drawn as `99+`, so a badge cannot grow without
   * bound and push a layout around.
   * @default 99
   */
  max?: number;
  /** Draw a `0` rather than nothing. */
  showZero?: boolean;
  /**
   * A dot with no number: "something changed here", where the count is not
   * worth saying. Takes precedence over `count`.
   */
  dot?: boolean;
  /**
   * What a screen reader says. Defaults to the count and what it is about —
   * "3 unread" reads better than "3".
   */
  label?: string;
  /** Fill color. Defaults to the kit's destructive red, as a badge is on every platform. */
  color?: string;
  /** Color of the number. Defaults to whichever of black or white reads on `color`. */
  textColor?: string;
  /** Identifier used to locate the component in end-to-end tests. */
  testID?: string;
  style?: StyleProp<ViewStyle>;
}
