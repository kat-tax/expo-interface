import type {HeaderActionsProps} from './index';
import {StyleSheet, View} from 'react-native';
import {HeaderHost} from '../header/shared';
import {spacing} from '../theme';

/**
 * Windows: the row is a React Native view — each action is a XAML island of
 * its own, so there is no single native row to put them in — spaced by the
 * kit's small step, the gap between the command buttons of a WinUI title
 * bar.
 */
export function HeaderActions({children, testID}: HeaderActionsProps) {
  return (
    <HeaderHost>
      <View style={styles.row} testID={testID}>
        {children}
      </View>
    </HeaderHost>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
  },
});

export type {HeaderActionsProps} from './index';
