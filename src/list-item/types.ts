import type {IconToken} from '../icons';
import type {ReactNode} from 'react';

/**
 * A text action at the trailing edge of a `ListItem` (sign in, sign out,
 * clear cache): a Compose `TextButton`, a borderless SwiftUI `Button`, a DOM
 * button. The row itself stays inert unless it also has an `onPress`.
 */
/**
 * One of a row's own actions. Shaped to suit both ends of the split: a
 * SwiftUI button behind a swipe, and an entry in the platform's context menu.
 */
export interface ListItemSwipeAction {
  label: string;
  onPress: () => void;
  /** Shown beside the label in the menu, and on the swipe button on iOS. */
  icon?: IconToken;
  /** `destructive` draws it in the danger color, and lets a full swipe run it. */
  role?: 'default' | 'destructive';
  disabled?: boolean;
}

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
  /**
   * How much chrome the action carries: `text` is the label on its own (a
   * link at the row's edge, the platform default for a settings row);
   * `filled` is a small rounded control in the accent color, for a call to
   * action that should read as a button beside the row's other controls.
   * @default 'text'
   */
  variant?: 'text' | 'filled';
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
  /**
   * The row's own actions — delete, share, archive — reached by whichever
   * gesture the platform uses for them.
   *
   * iOS reveals them on a swipe from the trailing edge, which is the system's
   * own `swipeActions`. **Nowhere else has a swipe to reveal them with**:
   * Compose has no equivalent in `@expo/ui`, and WinUI's `SwipeControl`
   * needs XAML content to swipe while this row is drawn in React Native. So
   * on Android, Windows and web the same actions are the row's context menu —
   * a long press, or a right click — which is each platform's own affordance
   * for "there is more to do with this row" and is native on all three.
   *
   * The actions are therefore always reachable, and always through something
   * the platform already teaches people. Do not wrap the row in a
   * `ContextMenu` as well: it would nest two of them off the same gesture.
   */
  swipeActions?: ListItemSwipeAction[];
  /** Secondary content below the headline; strings get subtle styling. */
  supporting?: string | ReactNode;
  /**
   * Whether the row draws its own padding. A `FieldGroup.Section` insets and
   * sizes every row it holds, and turns this off for the rows it is given —
   * a row that padded itself again would sit further in than its siblings.
   * @default true
   */
  inset?: boolean;
  /** Tap handler, active over the entire row. */
  onPress?: () => void;
  /** Identifier used to locate the row in end-to-end tests. */
  testID?: string;
}
