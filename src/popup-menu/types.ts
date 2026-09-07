import type {MenuItem, MenuPoint} from '../menu/types';

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
 */
export interface PopupMenuProps {
  /** Entries shown in the menu. */
  items: MenuItem[];
  /**
   * Where the menu is open, in the coordinates of the parent the popup is
   * laid over (the canvas's own coordinates). `null` closes it.
   */
  at: MenuPoint | null;
  /**
   * Keeps only the entries whose label contains this text, for a menu typed
   * into (a slash command). Case-insensitive; an empty string keeps them all.
   */
  filter?: string;
  /** Called when the menu closes, so the caller can clear `at`. */
  onDismiss?: () => void;
  /** Identifier used to locate the menu in end-to-end tests. */
  testID?: string;
}

/** Applies {@link PopupMenuProps.filter} to the entries. */
export function filterItems(items: MenuItem[], filter?: string): MenuItem[] {
  const query = filter?.trim().toLowerCase();
  if (!query) return items;
  return items.filter(item => item.label.toLowerCase().includes(query));
}
