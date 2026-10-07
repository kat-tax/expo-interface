import type {PropsWithChildren, ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {MenuItem} from '../menu/types';

/** The star on a card: whether it is set, and what to do when it is pressed. */
export interface CardFavorite {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /**
   * Accessibility name of the star.
   * @default 'Favorite'
   */
  label?: string;
}

/**
 * A pressable `Surface` with slots: a document in a list, a space on a
 * dashboard. The body is the card's own picture (a preview, a thumbnail),
 * with a header over it and a footer under it, or `media` bleeding to the
 * card's edges above the padded content.
 *
 * Drawn in React Native on every platform, like `Surface`, because that is
 * what its body holds. The controls a card carries are the kit's: `menu`
 * puts the platform's menu level with the footer, `favorite` a star over
 * the picture that a pointer reveals. Anything else goes in `overlay` and
 * `badge`, not in the body: a button cannot be nested in the card's own.
 */
export interface CardProps extends PropsWithChildren {
  /**
   * A picture that bleeds to the card's edges above everything else: a
   * preview, a thumbnail, clipped to the card's corners. The header, body
   * and footer keep their padding under it.
   */
  media?: ReactNode;
  /** Row above the body. */
  header?: ReactNode;
  /**
   * The card's name, as the footer the kit draws: one line in the label
   * color, with `subtitle` under it in the secondary color, and room at the
   * trailing edge for `menu`. Names the card for assistive technology too,
   * unless `label` does.
   */
  title?: string;
  /** A date, a count, an owner, under `title`. */
  subtitle?: string;
  /** Row below the body, for a footer of the app's own in place of `title`. */
  footer?: ReactNode;
  /**
   * The card's own actions (rename, share, delete), as the platform's menu
   * behind an ellipsis at the trailing edge, level with the footer: a
   * SwiftUI `Menu`, a Compose `DropdownMenu`, a popover on web, a WinUI
   * `MenuFlyout`. Outside the card's press target, like `overlay`.
   */
  menu?: MenuItem[];
  /**
   * A star over the card's top trailing corner: the kit's `IconToggle`,
   * filled while it is set. While it is not set it is drawn only while a
   * pointer is over the card or the keyboard is in it, on the platforms that
   * have a pointer (web with `(hover: hover)`, Windows), and always where
   * nothing hovers.
   */
  favorite?: CardFavorite;
  /**
   * Controls floated over the card's trailing edge, level with the footer —
   * a menu, a count. Outside the card's press target, so they take their own
   * presses (and are real sibling buttons on web). `menu` takes this slot.
   */
  overlay?: ReactNode;
  /**
   * Controls floated over the card's top trailing corner, where the body's
   * picture is — a star, a status chip. The same slot as `overlay` at the
   * other end of the card, and a card may carry both; keep it drawn rather
   * than revealed, since a phone has no hover to reveal it with. `favorite`
   * takes this slot.
   */
  badge?: ReactNode;
  /** Called when the card is pressed. */
  onPress?: () => void;
  /** Called on a long press (a context menu). */
  onLongPress?: () => void;
  /** Accessibility name of the card. Defaults to `title` and `subtitle`. */
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
