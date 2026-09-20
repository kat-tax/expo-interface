import type {ListItemProps} from './types';
import {ListItem as UIListItem} from '@expo/ui';
import {SwipeActions} from '@expo/ui/swift-ui';
import {Button} from '../button';

/**
 * iOS renders the universal `@expo/ui` `ListItem` (a SwiftUI list row)
 * through explicit slot props. An `action` is the kit's `Button` at the end
 * of the trailing slot, after any `trailing` content; the row itself only
 * responds when it also has an `onPress`. `inset` has nothing to turn off
 * here: the row is a bare `HStack` and every inset comes from the SwiftUI
 * `Form` around it.
 *
 * `swipeActions` become the system's own `swipeActions`: revealed by a swipe
 * from the trailing edge, with a full swipe running the destructive one the
 * way Mail's does.
 */
export function ListItem({children, leading, trailing, action, supporting, swipeActions, onPress, testID}: ListItemProps) {
  const filled = action?.variant === 'filled';
  const trailingContent = action ? (
    <>
      {trailing}
      <Button
        label={action.label}
        variant={filled ? 'filled' : 'text'}
        shape={filled ? 'rounded' : undefined}
        size="small"
        role={action.role === 'destructive' ? 'destructive' : 'default'}
        disabled={action.disabled}
        onPress={action.onPress}
      />
    </>
  ) : trailing;
  const row = (
    <UIListItem
      onPress={onPress}
      leading={leading}
      trailing={trailingContent}
      supportingText={supporting}
      testID={testID}>
      {children}
    </UIListItem>
  );
  if (!swipeActions || swipeActions.length === 0) return row;
  // The system's own swipe, which is the gesture iOS teaches for a row's
  // actions. A full swipe runs the destructive one, as Mail's does.
  return (
    <SwipeActions>
      {row}
      <SwipeActions.Actions edge="trailing" allowsFullSwipe={swipeActions.some(a => a.role === 'destructive')}>
        {swipeActions.map((swipe, index) => (
          <Button
            key={index}
            label={swipe.label}
            prefixIcon={swipe.icon}
            role={swipe.role === 'destructive' ? 'destructive' : 'default'}
            disabled={swipe.disabled}
            onPress={swipe.onPress}
          />
        ))}
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

export type {ListItemProps} from './types';
