import type {ReactNode} from 'react';

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
  /** Secondary content below the headline; strings get subtle styling. */
  supporting?: string | ReactNode;
  /** Tap handler, active over the entire row. */
  onPress?: () => void;
  /** Identifier used to locate the row in end-to-end tests. */
  testID?: string;
}
