import type {HeaderActionsProps} from './index';
import {StyleSheet, View} from 'react-native';
import {HeaderHost, useInHeader} from '../header/shared';
import {HeaderSlot} from '../header/slot';
import {spacing} from '../theme';

/**
 * Windows: the row is a React Native view — each action is a XAML island of
 * its own, so there is no single native row to put them in — spaced by the
 * kit's small step, the gap between the command buttons of a WinUI title
 * bar. From a screen's content it is sent to the header row the kit's
 * stack draws.
 */
export function HeaderActions(props: HeaderActionsProps) {
  const inHeader = useInHeader();
  if (!inHeader) return <HeaderSlot><HeaderActions {...props}/></HeaderSlot>;
  return (
    <HeaderHost>
      <View style={styles.row} testID={props.testID}>
        {props.children}
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
