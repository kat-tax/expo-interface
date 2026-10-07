import type {PropsWithChildren} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {StyleSheet} from 'react-native';
import {Row} from '@expo/ui';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {spacing} from '../theme';

interface FloatingSurfaceProps extends PropsWithChildren {
  /** The space between the controls. */
  gap: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * iOS and web: a floating bar is the kit's raised capsule, holding its
 * controls as one native row in a host of its own, the width of the controls.
 */
export function FloatingSurface({gap, style, testID, children}: FloatingSurfaceProps) {
  return (
    <Surface raised border="all" radius="pill" style={[styles.surface, style]} testID={testID}>
      <NativeHost fit>
        <Row alignment="center" spacing={gap}>{children}</Row>
      </NativeHost>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.two,
    paddingVertical: spacing.one,
  },
});
