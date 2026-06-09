import type {ListItemProps} from './types';
import {ListItem as UIListItem} from '@expo/ui';

/**
 * Web/iOS render the universal `@expo/ui` `ListItem` (RN row on web, SwiftUI
 * list row on iOS) through explicit slot props.
 */
export function ListItem({children, leading, trailing, supporting, onPress, testID}: ListItemProps) {
  return (
    <UIListItem
      onPress={onPress}
      leading={leading}
      trailing={trailing}
      supportingText={supporting}
      testID={testID}>
      {children}
    </UIListItem>
  );
}

export type {ListItemProps} from './types';
