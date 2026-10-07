import type {SheetActionsProps} from './shared';
import {HStack} from '@expo/ui/swift-ui';
import {frame, padding} from '@expo/ui/swift-ui/modifiers';
import {Button} from '../button';
import {actionVariant, sub} from './shared';

/** iOS: the buttons along the sheet's bottom edge as one SwiftUI row, trailing-aligned. */
export function SheetActions({actions, testID}: SheetActionsProps) {
  return (
    <HStack alignment="center" spacing={8} modifiers={[frame({maxWidth: Infinity, alignment: 'trailing'}), padding({top: 12})]} testID={testID}>
      {actions.map((action, index) => (
        <Button
          key={index}
          label={action.label}
          variant={actionVariant(action, index, actions.length)}
          role={action.role}
          disabled={action.disabled}
          loading={action.loading}
          onPress={action.onPress}
          testID={sub(testID, String(index))}
        />
      ))}
    </HStack>
  );
}
