import type {MaterialThickness} from '../material/types';
import type {MenuItem, MenuPoint} from '../menu/types';
import {optionId} from '../menu/option-id';

/** A rectangle in the coordinates of the parent a `PopupMenu` is laid over: a handle, a chip, a selection. */
export interface MenuRect extends MenuPoint {
  width: number;
  height: number;
}

/**
 * Why a popup menu closed of its own accord: an entry was picked, or it was
 * dismissed by a press outside it, Escape or the platform's back gesture. A
 * close the app asked for, by clearing `at`, is not reported. `select`
 * follows the picked entry's `onPress`, on every platform.
 */
export type PopupMenuDismissReason = 'select' | 'dismiss';

/**
 * The platform's menu, opened at a point over content the kit did not draw:
 * a right click on a canvas, the caret in an editor, a block's grip.
 *
 * `ContextMenu` wraps content and needs it to be native; a popup menu wraps
 * nothing. It is laid over its parent as an overlay — a zero-size anchor at
 * `at`, with the menu opening from it — so the content underneath can be a
 * React Native view, a WebView, a canvas.
 *
 * - iOS: a SwiftUI `popover` presented from that anchor.
 * - Android: a Material 3 `DropdownMenu` anchored to it.
 * - Web: the same `popover="auto"` element `Menu` opens, placed by CSS
 *   anchor positioning.
 * - Windows: a WinUI `MenuFlyout` placed at the point.
 */
export interface PopupMenuProps {
  /** Entries shown in the menu. */
  items: MenuItem[];
  /**
   * Where the menu is open, in the coordinates of the parent the popup is
   * laid over (the canvas's own coordinates): a point, or a rectangle the
   * menu opens beside (a handle, a chip). `null` closes it. While the menu
   * is open it follows a new point or rectangle: a menu moved from one
   * handle to the next stays open, and no dismissal of the first reaches the
   * second. On web that holds for a move made by a press outside the menu
   * too, as a context menu raised by the next handle's right button is: the
   * menu is closed while the press is held and shown at the new place once
   * it is over. On iOS, Android and Windows a press outside the open menu is
   * the platform's dismissal, reported as `dismiss`.
   */
  at: MenuPoint | MenuRect | null;
  /**
   * Which side of a rectangle the menu opens on: under it, or over it. It is
   * a preference where the platform places the menu itself and moves it to
   * stay on screen.
   * @default 'auto'
   */
  preferredEdge?: 'auto' | 'top' | 'bottom';
  /**
   * Keeps only the entries this text finds, for a menu typed into (a slash
   * command): the ones whose label contains it, and the ones that answer to
   * it by one of their `keywords`. Case-insensitive; an empty string keeps
   * them all.
   */
  filter?: string;
  /**
   * Web only: whether the menu takes the keyboard focus as it opens. `false`
   * leaves the focus in the field it is in (the editor a slash command is
   * typed into): the menu is then a `listbox` whose current entry is
   * `highlighted`, which the field moves with its arrow keys and names in
   * its `aria-activedescendant` (`popupOptionId(id, index)`). The native
   * menus take the focus as their platform does.
   * @default true
   */
  takesFocus?: boolean;
  /**
   * Web only: the index of the entry drawn as the current one, among the
   * entries `filter` keeps, in a menu that does not take the focus.
   */
  highlighted?: number;
  /**
   * Web only: the menu's DOM id, which the field's `aria-controls` names in
   * a menu that does not take the focus.
   */
  id?: string;
  /**
   * Called when the menu closes of its own accord, with why, so the caller
   * can clear `at`; a `select` comes after the entry's `onPress`.
   */
  onDismiss?: (reason: PopupMenuDismissReason) => void;
  /**
   * Web only: the material the menu draws on, as `Menu` takes it. The app's
   * `overlayMaterial` (`AccentProvider`) unless given.
   */
  material?: MaterialThickness;
  /** Identifier used to locate the menu in end-to-end tests. */
  testID?: string;
}

/**
 * The DOM id of an entry in a menu that does not take the focus, for the
 * field's `aria-activedescendant`: the menu's `id` and the entry's index
 * among the ones `filter` keeps.
 */
export function popupOptionId(id: string, index: number): string {
  return optionId(id, index);
}

/** Applies {@link PopupMenuProps.filter} to the entries. */
export function filterItems(items: MenuItem[], filter?: string): MenuItem[] {
  const query = filter?.trim().toLowerCase();
  if (!query) return items;
  return items.filter(item => answersTo(item, query));
}

/** Whether one entry is found by a query, by its label or by its keywords. */
function answersTo(item: MenuItem, query: string): boolean {
  if (item.label.toLowerCase().includes(query)) return true;
  return item.keywords?.some(word => word.toLowerCase().includes(query)) ?? false;
}

/** The rectangle's size, or a point's: nothing. */
export function sizeOf(at: MenuPoint | MenuRect | null): {width: number; height: number} {
  return at && 'width' in at ? {width: at.width, height: at.height} : {width: 0, height: 0};
}

/**
 * The point a native menu opens from: a point as it is, and for a rectangle
 * its top edge when the top was asked for and its bottom edge otherwise, so
 * the menu opens beside the rectangle rather than over it.
 */
export function anchorPoint(at: MenuPoint | MenuRect | null, edge: 'auto' | 'top' | 'bottom'): MenuPoint {
  if (!at) return {x: 0, y: 0};
  const {height} = sizeOf(at);
  return {x: at.x, y: edge === 'top' ? at.y : at.y + height};
}
