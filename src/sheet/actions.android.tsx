import type {SheetActionsProps} from './shared';
import {Row} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, padding, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {Button} from '../button';
import {actionVariant, sub} from './shared';

/** Android: the buttons along the sheet's bottom edge as one Compose row, trailing-aligned. */
export function SheetActions({actions, testID}: SheetActionsProps) {
  return (
    <Row verticalAlignment="center" horizontalArrangement="end" modifiers={[fillMaxWidth(), padding(0, 12, 0, 0), ...(testID ? [testIDModifier(testID)] : [])]}>
      <Row verticalAlignment="center" horizontalArrangement={{spacedBy: 8}}>
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
      </Row>
    </Row>
  );
}
