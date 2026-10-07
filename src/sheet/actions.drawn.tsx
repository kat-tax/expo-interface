import type {SheetActionsProps} from './shared';
import {StyleSheet, View} from 'react-native';
import {Button} from '../button';
import {actionVariant, sub} from './shared';

/** Web and Windows: the buttons along the sheet's bottom edge, trailing-aligned. */
export function SheetActions({actions, testID}: SheetActionsProps) {
  return (
    <View style={styles.row} testID={testID}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
});
