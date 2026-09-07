import type {ReactNode} from 'react';

/**
 * A text action at the trailing edge of a `ListItem` (sign in, sign out,
 * clear cache): a Compose `TextButton`, a borderless SwiftUI `Button`, a DOM
 * button. The row itself stays inert unless it also has an `onPress`.
 */
export interface ListItemAction {
  /** The action's text. */
  label: string;
  /** Called when the action is pressed. */
  onPress: () => void;
  /** Greys the action out and ignores presses. */
  disabled?: boolean;
  /**
   * `destructive` renders the action in the danger color.
   * @default 'default'
   */
  role?: 'default' | 'destructive';
}

/**
 * Props for the app `ListItem`: a tappable row with leading/trailing slots
 * and optional supporting text. Bridges the universal `@expo/ui` `ListItem`
 * on web/iOS and the Material 3 Compose `ListItem` on Android.
 */
export interface ListItemProps {
  /** Headline content; strings are wrapped in default label styling. */
  children?: ReactNode;
  /** Leading (start) slot — icon, avatar, etc. */
  leading?: ReactNode;
  /** Trailing (end) slot — chevron, value, control, etc. */
  trailing?: ReactNode;
  /** A text action rendered natively at the trailing edge, after `trailing`. */
  action?: ListItemAction;
  /** Secondary content below the headline; strings get subtle styling. */
  supporting?: string | ReactNode;
  /** Tap handler, active over the entire row. */
  onPress?: () => void;
  /** Identifier used to locate the row in end-to-end tests. */
  testID?: string;
}
