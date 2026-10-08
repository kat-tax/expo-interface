import type {ReactNode} from 'react';
import type {MenuItem} from '../menu/types';
import type {ListItemProps, ListItemSwipeAction} from './types';
import {ContextMenu} from '../context-menu';

/** The size the kit draws a row's `icon` at. */
export const ROW_ICON = 24;

/** The row's actions as menu entries, for the platforms that reveal them that way. */
export function asMenuItems(actions: readonly ListItemSwipeAction[]): MenuItem[] {
  return actions.map(action => ({
    label: action.label,
    icon: action.icon,
    role: action.role,
    disabled: action.disabled,
    onPress: action.onPress,
  }));
}

/** The text a node is, where it is one, for the row's name. */
export function textOf(node: ReactNode): string | undefined {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : undefined;
}

/** What a badge says: a count of new things, or that there is something. */
export function badgeWords(badge: boolean | number | undefined): string | undefined {
  if (badge === undefined || badge === false || badge === 0) return undefined;
  return typeof badge === 'number' ? `${badge} new` : 'new';
}

/**
 * The row's accessible name, composed from its slots: the headline, the
 * supporting text, the value and what the badge says, so a screen reader
 * says "Essay, edited yesterday, 2 KB, 3 new" as one thing rather than
 * four loose ones. Only for a row whose headline is text; a row whose
 * headline is content of the app's own names itself through that content.
 * It names the row on iOS, web and Windows: `@expo/ui`'s Compose layer has
 * no modifier that sets a description, so an Android row is read from its
 * own texts.
 */
export function rowLabel({children, supporting, value, badge}: Pick<ListItemProps, 'children' | 'supporting' | 'value' | 'badge'>): string | undefined {
  const headline = textOf(children);
  if (headline === undefined) return undefined;
  return [headline, textOf(supporting), value, badgeWords(badge)].filter(Boolean).join(', ');
}

/**
 * Wraps a row in the platform's context menu when it has actions of its own.
 *
 * This is what Android, Windows and web do instead of a swipe. None of the
 * three has one to offer: Compose has no equivalent in `@expo/ui`, and WinUI's
 * `SwipeControl` needs XAML content to swipe while this row is drawn in React
 * Native. A context menu is each platform's own answer to "there is more to do
 * with this row", and it is a real native menu on all three.
 */
export function WithRowMenu({
  actions,
  onPress,
  children,
}: {
  actions: readonly ListItemSwipeAction[] | undefined;
  onPress?: () => void;
  children: ReactNode;
}) {
  if (!actions || actions.length === 0) return <>{children}</>;
  return (
    <ContextMenu items={asMenuItems(actions)} onPress={onPress}>
      {children}
    </ContextMenu>
  );
}
