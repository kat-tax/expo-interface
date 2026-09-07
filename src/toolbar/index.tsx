import type {ReactNode} from 'react';
import type {ToolbarProps} from './types';
import {StyleSheet, View} from 'react-native';
import {Row, Spacer} from '@expo/ui';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {spacing} from '../theme';

/** Space between the controls in a group. */
const GAP = spacing.two;

/**
 * A bar of tools along a canvas (see {@link ToolbarProps}). The bar itself
 * is a `Surface` in the screen's background with a hairline on the edge
 * facing the content; the controls are native.
 */
export function Toolbar({leading, trailing, field, placement = 'bottom', children, style, testID}: ToolbarProps) {
  return (
    <Surface
      color="background"
      radius={0}
      border={placement === 'bottom' ? 'top' : 'bottom'}
      style={[styles.bar, style]}
      testID={testID}>
      {field == null ? (
        // One host: the whole bar of controls is a single native view.
        <NativeHost>
          <Row alignment="center" spacing={GAP}>
            {leading}
            <Spacer flexible/>
            {trailing}
          </Row>
        </NativeHost>
      ) : (
        <View style={styles.row}>
          <Group>{leading}</Group>
          <View style={styles.field}>{field}</View>
          <Group>{trailing}</Group>
        </View>
      )}
      {children}
    </Surface>
  );
}

/** One side's controls, in a host of their own beside a React Native field. */
function Group({children}: {children?: ReactNode}) {
  if (!children) return null;
  return (
    <NativeHost fit>
      <Row alignment="center" spacing={GAP}>{children}</Row>
    </NativeHost>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingHorizontal: spacing.three,
    paddingVertical: spacing.two,
    gap: spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
  },
  field: {
    flex: 1,
  },
});
