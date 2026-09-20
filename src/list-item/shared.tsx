import type {ReactNode} from 'react';
import type {MenuItem} from '../menu/types';
import type {ListItemSwipeAction} from './types';
import {ContextMenu} from '../context-menu';

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
