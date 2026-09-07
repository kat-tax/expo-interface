import type {ListItemProps} from './types';
import {ListItem as UIListItem} from '@expo/ui';
import {Button} from '../button';

/**
 * iOS renders the universal `@expo/ui` `ListItem` (a SwiftUI list row)
 * through explicit slot props. An `action` is the kit's text `Button` at the
 * end of the trailing slot, after any `trailing` content; the row itself
 * only responds when it also has an `onPress`.
 */
export function ListItem({children, leading, trailing, action, supporting, onPress, testID}: ListItemProps) {
  const trailingContent = action ? (
    <>
      {trailing}
      <Button
        label={action.label}
        variant="text"
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
