import type {ReactNode} from 'react';
import type {ToolbarProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Surface} from '../surface';
import {spacing} from '../theme';

const DENSITY = {
  regular: {gap: spacing.two, edge: spacing.three},
  compact: {gap: spacing.half, edge: spacing.two},
} as const;

/**
 * Windows: the bar is the same `Surface`, and its controls are React Native
 * rows — every kit control is a XAML island of its own here, so there is no
 * single native row to gather them in, and a `field` needs no host either
 * side of it.
 */
export function Toolbar({leading, trailing, field, placement = 'bottom', density = 'regular', children, style, testID}: ToolbarProps) {
  const {gap, edge} = DENSITY[density];
  return (
    <Surface
      color="background"
      radius={0}
      border={placement === 'bottom' ? 'top' : 'bottom'}
      style={[styles.bar, {paddingHorizontal: edge}, style]}
      testID={testID}>
      <View style={[styles.row, {gap}]}>
        <Group gap={gap}>{leading}</Group>
        {field != null ? <View style={styles.field}>{field}</View> : <View style={styles.spacer}/>}
        <Group gap={gap}>{trailing}</Group>
      </View>
      {children}
    </Surface>
  );
}

function Group({gap, children}: {gap: number; children?: ReactNode}) {
  if (!children) return null;
  return <View style={[styles.group, {gap}]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingVertical: spacing.two,
    gap: spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
