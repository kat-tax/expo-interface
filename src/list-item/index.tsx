import type {ListItemProps} from './types';
import {ListItem as UIListItem} from '@expo/ui';
import {Button} from '../button';

/**
 * iOS renders the universal `@expo/ui` `ListItem` (a SwiftUI list row)
 * through explicit slot props. An `action` is the kit's `Button` at the end
 * of the trailing slot, after any `trailing` content; the row itself only
 * responds when it also has an `onPress`. `inset` has nothing to turn off
 * here: the row is a bare `HStack` and every inset comes from the SwiftUI
 * `Form` around it.
 */
export function ListItem({children, leading, trailing, action, supporting, onPress, testID}: ListItemProps) {
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
  return (
    <UIListItem
      onPress={onPress}
      leading={leading}
      trailing={trailingContent}
      supportingText={supporting}
      testID={testID}>
      {children}
    </UIListItem>
  );
}

export type {ListItemProps} from './types';
