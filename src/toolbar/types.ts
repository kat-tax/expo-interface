import type {PropsWithChildren, ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {IconToken} from '../icons';

/** Which edge of its content a `Toolbar` sits on, and so where its rule goes. */
export type ToolbarPlacement = 'top' | 'bottom';

/** How tightly a `Toolbar` packs its controls across the bar. */
export type ToolbarDensity = 'regular' | 'compact';

/**
 * A bar of tools along a canvas: the editor's status bar, the strip over a
 * drawing, the row under a preview.
 *
 * The controls are one native view — a `Row` inside a single host — so a bar
 * of buttons and menus costs one bridge crossing rather than one per group.
 * Put a `Divider vertical` between groups; both slots take the kit's own
 * controls, which draw natively inside the host.
 *
 * A `field` breaks that in one place: a text field is a React Native input,
 * so with one the bar is a leading host, the field, and a trailing host.
 */
/**
 * One command in a bar described as data rather than as children.
 *
 * Data is what a platform's own bar wants: WinUI's `CommandBar` builds its
 * own `AppBarButton`s and decides which of them fit, moving the rest into an
 * overflow menu it draws itself. A bar handed React children can only be
 * drawn by the kit.
 */
export interface ToolbarCommand {
  label: string;
  icon?: IconToken;
  onPress?: () => void;
  /**
   * Put this one in the overflow menu rather than on the bar. On Windows the
   * platform may move others there too, as the bar narrows.
   */
  secondary?: boolean;
  disabled?: boolean;
  /** `destructive` draws the command in the danger color. */
  role?: 'default' | 'destructive';
  /** A rule before this command, to group the ones after it. */
  separator?: boolean;
  testID?: string;
}

export interface ToolbarProps extends PropsWithChildren {
  /**
   * The bar's controls, as data. **Replaces `leading` and `trailing`** — a
   * bar is one or the other, because a platform that builds its own bar
   * cannot be handed React children to put in it.
   *
   * Worth the swap on Windows, where this is a real `CommandBar`: the
   * platform lays the commands out, moves what does not fit into an overflow
   * menu, and draws the labels and the keyboard affordances itself. Elsewhere
   * the kit draws the same commands as its own buttons, with the secondary
   * ones behind a menu.
   */
  commands?: ToolbarCommand[];
  /** Controls at the leading edge. */
  leading?: ReactNode;
  /** Controls at the trailing edge. */
  trailing?: ReactNode;
  /**
   * A field between the two groups — a `TextField variant="inline"` for a
   * search or a prompt. It grows into the space the controls leave.
   */
  field?: ReactNode;
  /**
   * Which edge the bar sits on: the rule goes on the side facing the
   * content.
   * @default 'bottom'
   */
  placement?: ToolbarPlacement;
  /**
   * How tightly the controls are packed: `compact` cuts the space between
   * them and pulls in the bar's ends, for a bar of many icon tools on a
   * narrow screen — where the regular spacing is what squeezes a `field`.
   * The bar's height is the same either way.
   * @default 'regular'
   */
  density?: ToolbarDensity;
  /** A second row under the controls: peers, counts, a progress bar. */
  children?: ReactNode;
  /** Style applied to the bar. */
  style?: StyleProp<ViewStyle>;
  /** Identifier used to locate the bar in end-to-end tests. */
  testID?: string;
}
