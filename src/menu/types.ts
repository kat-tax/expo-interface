import type {ReactNode} from 'react';
import type {IconToken} from '../icons';
import type {ButtonProps} from '../button/types';

/** One entry of a `Menu` / `ContextMenu` / `Fab` menu. */
export interface MenuItem {
  /** Item text. */
  label: string;
  /** Leading icon. */
  icon?: IconToken;
  /**
   * A color dot (`#rrggbb`) in place of the icon, for a palette. Drawn on
   * Android and web; iOS menus render images monochrome, so the dot is not
   * shown there.
   */
  swatch?: string;
  /**
   * The item is the current state (the block's kind, the sort order): a
   * check mark. SwiftUI shows it as a checked `Toggle` item, Compose as a
   * trailing check, the web popup as a tick.
   */
  active?: boolean;
  /**
   * `destructive` renders the item in the danger color.
   * @default 'default'
   */
  role?: 'default' | 'destructive';
  /** Greys the item out and ignores presses. */
  disabled?: boolean;
  /**
   * Extra words the entry answers to when the menu is filtered — a synonym,
   * an abbreviation, what the same thing is called elsewhere. Never drawn,
   * and only read by `PopupMenu`'s `filter`: `todo` finds a task list, `h1` a
   * heading.
   */
  keywords?: string[];
  /** Draw a separator above this item. */
  separator?: boolean;
  /**
   * The keyboard shortcut that selects the item, written `Ctrl+S`,
   * `Ctrl+Shift+N`, `F2`. On Windows it is drawn beside the label, as
   * WinUI's menus show accelerators, and bound wherever the focus is while
   * the menu is mounted (unless the item is disabled); the other platforms
   * ignore it.
   */
  shortcut?: string;
  /** Called when the item is selected; the menu then closes. */
  onPress?: () => void;
}

/** How the web `Menu` trigger looks. */
export type MenuTrigger = 'button' | 'link';

/**
 * Cross-platform dropdown menu opened from a button.
 *
 * Bridges the SwiftUI `Menu` on iOS, the Jetpack Compose Material 3
 * `DropdownMenu` on Android, and a `role="menu"` popup on web. The trigger
 * looks like the kit's `Button` and takes the same styling props.
 */
export interface MenuProps extends Pick<ButtonProps, 'variant' | 'size' | 'shape' | 'color' | 'tone' | 'iconSize' | 'hideLabel' | 'disabled'> {
  /** Trigger text (kept for accessibility when `hideLabel` is set). */
  label: string;
  /** Trigger icon. */
  icon?: IconToken;
  /** Entries shown when the menu opens. */
  items: MenuItem[];
  /**
   * Web only: `button` renders the kit's button, `link` a text link like the
   * tab bar's tabs (the icon and the label in the tint), for a menu that
   * sits in a bar.
   * @default 'button'
   */
  trigger?: MenuTrigger;
  /**
   * Called when the menu opens and when it closes. Reported on Android (the
   * kit owns the `DropdownMenu`'s expanded state) and on web (the popover's
   * `toggle` event); SwiftUI's `Menu` and `contextMenu` have no presentation
   * binding, so iOS never reports it.
   */
  onOpenChange?: (open: boolean) => void;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}

/** A point a `ContextMenu` opens at, in the coordinates of its content. */
export interface MenuPoint {
  x: number;
  y: number;
}

/**
 * Which gesture opens a `ContextMenu`.
 *
 * `longPress` is the default and the platform's own context gesture: a
 * SwiftUI `contextMenu` that lifts the content into a preview, Compose's
 * `onLongClick`, a touch long-press on web and Windows.
 *
 * `tap` is a real control on all four rather than a gesture the kit times —
 * iOS swaps `contextMenu` for a SwiftUI `Menu`, which opens on tap and is
 * the same control the kit's own `Menu` uses. It suits content whose only
 * purpose is its menu: an overflow grip, a block's handle.
 *
 * **There is deliberately no `doubleTap`**, which an earlier plan named.
 * `@expo/ui` exposes only `onClick` and `onLongClick` from Compose's
 * `combinedClickable` (Compose itself has `onDoubleClick`; the binding does
 * not), and on iOS there is no answer at all — `onTapGesture` takes no count
 * there and a `contextMenu` cannot be opened programmatically. Web has a real
 * `dblclick` and Windows could be timed by hand, so it would be two platforms
 * with the gesture and two without, one of them unable to have it. A trigger
 * that silently does something else on iOS is worse than a trigger the kit
 * does not offer.
 */
export type ContextMenuTrigger = 'tap' | 'longPress';

/**
 * Cross-platform context menu attached to arbitrary content.
 *
 * Opens on long-press (iOS `contextMenu`, Android `DropdownMenu` anchored by
 * `combinedClickable`) or right-click / long-press on web. `children` must
 * be native (`@expo/ui`) content on iOS/Android.
 */
export interface ContextMenuProps {
  /** Entries shown when the menu opens. */
  items: MenuItem[];
  /** Content that triggers the menu. */
  children: ReactNode;
  /**
   * Called on a plain tap of the content (Android/web; iOS taps pass
   * through). Ignored when `trigger` is `tap`, where the tap opens the menu
   * and there is no second gesture left for it.
   */
  onPress?: () => void;
  /**
   * Which gesture opens the menu. The platform's own secondary gesture —
   * right-click on web and Windows, and the Menu key there — keeps working
   * whichever this is: taking away what the platform already teaches would
   * cost more than the prop gives.
   * @default 'longPress'
   */
  trigger?: ContextMenuTrigger;
  /** Disables the menu. */
  disabled?: boolean;
  /**
   * Opens the menu at this point whenever it changes, so a canvas can open
   * it where it says it was asked for (a right click it received itself, a
   * press on a block's grip). Relative to the content's top-left corner on
   * Android and web (web also accepts viewport coordinates for content that
   * fills it). iOS has no menu at a point: the long-press stays the only
   * trigger there. Pair with `onDismiss` to clear it once the menu closes.
   */
  at?: MenuPoint | null;
  /** Called when a menu opened by `at` (or a gesture) closes. */
  onDismiss?: () => void;
  /**
   * Called when the menu opens and when it closes. Reported on Android (the
   * kit owns the `DropdownMenu`'s expanded state) and on web (the popover's
   * `toggle` event); SwiftUI's `Menu` and `contextMenu` have no presentation
   * binding, so iOS never reports it.
   */
  onOpenChange?: (open: boolean) => void;
  /** Identifier used to locate the trigger in end-to-end tests. */
  testID?: string;
}
