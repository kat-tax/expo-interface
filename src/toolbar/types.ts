import type {PropsWithChildren, ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {AnchorAlign, AnchorInsets, AnchorRect} from '../anchored';
import type {ButtonTone} from '../button/types';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';

/** Which edge of its content a `Toolbar` sits on, and so where its rule goes. */
export type ToolbarPlacement = 'top' | 'bottom';

/** How tightly a `Toolbar` packs its controls across the bar. */
export type ToolbarDensity = 'regular' | 'compact';

/**
 * A bar of tools along a canvas: the editor's status bar, the strip over a
 * drawing, the row under a preview.
 *
 * The controls are one native view, a `Row` inside a single host, so a bar
 * of buttons and menus costs one bridge crossing rather than one per group.
 * Put a `Divider vertical` between groups, or give a command `separator`;
 * both slots take the kit's own controls, which draw natively inside the
 * host.
 *
 * A `field` breaks that in one place: a text field is a React Native input,
 * so with one the bar is a host either side of the field, for the sides that
 * have something to draw. A side with nothing to draw has no host, and the
 * field takes its room.
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
  /**
   * The icon alone, with `label` as the accessible name: a bar of tools. The
   * Windows `CommandBar` decides its own labels (`density`) and ignores it.
   */
  hideLabel?: boolean;
  /**
   * The command is a toggle, on (`true`) or off (`false`): bold in an
   * editor, a check that runs, a panel that is open. It is drawn filled in
   * the accent while on, and assistive technology hears the state: the kit's
   * `Button` with `pressed` on iOS, Android and web, an `AppBarToggleButton`
   * in the Windows `CommandBar`. Behind the kit's overflow menu (iOS,
   * Android, web and a drawn Windows bar) it is an entry with the menu's
   * check while it is on; a menu has no off state, so one that is off is a
   * plain entry. The `CommandBar`'s own overflow keeps the toggle button.
   * Leave it out for a command that is not a toggle.
   */
  active?: boolean;
  /**
   * Color of the command: the accent, or the label color for a tool, where
   * the accent marks the active one. The Windows `CommandBar` takes no tone
   * (a command is in the bar's own colors, a `destructive` one in the
   * critical color) and ignores it.
   * @default 'accent'
   */
  tone?: ButtonTone;
  /** Called on a press; ignored when `items` are given. */
  onPress?: () => void;
  /**
   * A menu instead of a press: the entries `Menu` takes, opened from the
   * command; `onPress`, `active` and `role` are ignored with them. On the
   * bar it is the kit's `Menu`, in the Windows `CommandBar` an
   * `AppBarButton` with its `MenuFlyout`. Behind the overflow its entries
   * take its place, set off by rules, since the kit's menus do not nest;
   * the `CommandBar` opens them as a submenu. A `disabled` command greys
   * its entries out, and on Windows binds none of their shortcuts. With no
   * entries the command is greyed out, since it would open on nothing.
   * Behind the kit's overflow it puts nothing, and with nothing else behind
   * it the bar draws no overflow menu; the Windows `CommandBar` keeps it as
   * a greyed-out button wherever it goes, its own overflow included.
   */
  items?: MenuItem[];
  /**
   * Put this one in the overflow menu rather than on the bar. On Windows the
   * platform may move others there too, as the bar narrows.
   */
  secondary?: boolean;
  disabled?: boolean;
  /** `destructive` draws the command in the danger color. Ignored when `items` are given. */
  role?: 'default' | 'destructive';
  /**
   * A rule before this command, to group the ones after it: a vertical
   * `Divider` on the bar, a rule in the overflow menu, an `AppBarSeparator`
   * in the Windows `CommandBar`. None is drawn before the first command of
   * a row or of the overflow.
   */
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
   * Commands beside the field, at its trailing edge: a find bar's previous
   * and next, an assistant's send. They share the trailing host with the
   * overflow menu, and they stay on the bar when it folds its other
   * commands. A side with nothing to draw has no host: with no field
   * commands, the trailing host is the overflow menu's alone, and there is
   * none when nothing is behind it. The field takes the room.
   */
  fieldCommands?: ToolbarCommand[];
  /**
   * Folds the bar's `commands` behind its overflow menu while the bar is in
   * the kit's compact size class (narrower than 640 points, where `TabView`
   * shows its switcher), leaving the field and its commands the room: an
   * editor's status bar while a find or assistant field is open on a phone.
   * A folded bar has no leading host, since nothing is drawn there, and with
   * no `fieldCommands` and nothing behind the overflow no trailing host
   * either: the field takes the row.
   * The width is the bar's own, measured whether or not it folds, so a bar
   * that starts folding while it is narrow folds at once. Read only on a bar
   * along an edge: a `floating` bar, or one `at` a rectangle, is the width of
   * its controls and never folds.
   * @default false
   */
  foldCommands?: boolean;
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
  /**
   * A bar that floats over the content rather than running along an edge:
   * raised and rounded, the width of its controls, as the strip of tools
   * over a selection or a block. Material's floating toolbar on Android.
   * @default false
   */
  floating?: boolean;
  /**
   * Floats the bar over its parent beside this rectangle (a selection, a
   * block): lined up with it by `align`, over it unless there is no room,
   * and kept inside the parent less `insets`. `null` hides it. The bar is
   * laid over the parent as an overlay that takes no presses but the bar's,
   * and is drawn only once it has been measured and placed. Implies
   * `floating`.
   */
  at?: AnchorRect | null;
  /**
   * How a bar at `at` lines up with the rectangle across: centred on it,
   * from its left edge (`start`), or to its right edge (`end`), for tools
   * that hang from a block's corner. Left and right in the x coordinates of
   * `at`, not leading and trailing, in a right-to-left layout too: React
   * Native's layout reports x from the parent's left edge whatever the
   * direction, and the bar is placed in those coordinates, though React
   * Native on iOS and Android swaps a view's `left` and `right` there. Kept
   * inside the parent less `insets` either way. Read only with `at`.
   * @default 'center'
   */
  align?: AnchorAlign;
  /**
   * Which side of `at` the bar prefers; it moves to the other when there is
   * no room.
   * @default 'top'
   */
  preferredEdge?: 'auto' | 'top' | 'bottom';
  /** What a bar at `at` keeps clear of at its parent's edges: a header, the keyboard's bar. */
  insets?: AnchorInsets;
  /** Style applied to the bar. */
  style?: StyleProp<ViewStyle>;
  /** Identifier used to locate the bar in end-to-end tests. */
  testID?: string;
}
