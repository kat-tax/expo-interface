import type {ReactNode} from 'react';
import type {ToolbarProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Row, Spacer} from '@expo/ui';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {spacing} from '../theme';

/**
 * Space between the controls, and at the bar's ends. `compact` is what a bar
 * of many icon tools needs on a narrow screen; the vertical padding, and so
 * the bar's height, is the same either way.
 */
const DENSITY = {
  regular: {gap: spacing.two, edge: spacing.three},
  compact: {gap: spacing.half, edge: spacing.two},
} as const;

/**
 * A bar of tools along a canvas (see {@link ToolbarProps}). The bar itself
 * is a `Surface` in the screen's background with a hairline on the edge
 * facing the content; the controls are native.
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
      {field == null ? (
        // One host: the whole bar of controls is a single native view.
        <NativeHost>
          <Row alignment="center" spacing={gap}>
            {leading}
            <Spacer flexible/>
            {trailing}
          </Row>
        </NativeHost>
      ) : (
        <View style={[styles.row, {gap}]}>
          <Group gap={gap}>{leading}</Group>
          <View style={styles.field}>{field}</View>
          <Group gap={gap}>{trailing}</Group>
        </View>
      )}
      {children}
    </Surface>
  );
}

/** One side's controls, in a host of their own beside a React Native field. */
function Group({gap, children}: {gap: number; children?: ReactNode}) {
  if (!children) return null;
  return (
    <NativeHost fit>
      <Row alignment="center" spacing={gap}>{children}</Row>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingVertical: spacing.two,
    // Between the control row and the second row, not between the controls.
    gap: spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
  },
});
