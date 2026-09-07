import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';

/**
 * Size of a `Fab`. `regular`, `small` and `large` are circles (56, 40 and
 * 96 points); `extended` is a capsule that shows the label beside the icon.
 */
export type FabSize = 'small' | 'regular' | 'large' | 'extended';

/**
 * Floating action button: the screen's primary action, floating over its
 * content at the bottom trailing corner (`Screen`'s `fab` slot places it).
 *
 * Android renders the Material 3 `FloatingActionButton` family; iOS, which
 * has no such control, draws the same geometry in SwiftUI (a circle or
 * capsule filled with the tint, the icon in `onTint`, a soft shadow); web
 * renders a DOM button with that geometry. With `items` the button opens a
 * menu instead of pressing: the same menu `Menu` renders, only the trigger
 * differs.
 */
export interface FabProps {
  /** Accessibility name of the button, and the text of an `extended` one. */
  label: string;
  /** The icon. */
  icon: IconToken;
  /** Called when the button is pressed (ignored when `items` are given). */
  onPress?: () => void;
  /** With items the button opens a menu instead of pressing. */
  items?: MenuItem[];
  /**
   * The size.
   * @default 'regular'
   */
  size?: FabSize;
  /** Disables interaction and dims the button. */
  disabled?: boolean;
  /** Identifier used to locate the button in end-to-end tests. */
  testID?: string;
}
