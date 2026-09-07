import type {PropsWithChildren, ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';

/**
 * A pressable `Surface` with slots: a document in a list, a space on a
 * dashboard. The body is the card's own picture (a preview, a thumbnail),
 * with a header over it and a footer under it.
 *
 * Drawn in React Native on every platform, like `Surface`, because that is
 * what its body holds. Actions go in `overlay`, not in the body: a button
 * cannot be nested in the card's own button.
 */
export interface CardProps extends PropsWithChildren {
  /** Row above the body. */
  header?: ReactNode;
  /** Row below the body: a title, a date. */
  footer?: ReactNode;
  /**
   * Controls floated over the card's trailing edge, level with the footer —
   * a star, a menu. Outside the card's press target, so they take their own
   * presses (and are real sibling buttons on web).
   */
  overlay?: ReactNode;
  /** Called when the card is pressed. */
  onPress?: () => void;
  /** Called on a long press (a context menu). */
  onLongPress?: () => void;
  /** Accessibility name of the card. */
  label?: string;
  /**
   * Padding inside the card.
   * @default 12
   */
  padding?: number;
  /** Space between the header, body and footer. @default 8 */
  gap?: number;
  /** Dims the card and ignores presses. */
  disabled?: boolean;
  /**
   * Style applied to the card itself. A width belongs on the container
   * around it rather than here: `overlay` is positioned against that box,
   * and the card fills it.
   */
  style?: StyleProp<ViewStyle>;
  /** Identifier used to locate the card in end-to-end tests. */
  testID?: string;
}
