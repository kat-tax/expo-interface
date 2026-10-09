import type {PropsWithChildren} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import type {MaterialThickness} from '../material/types';
import {StyleSheet} from 'react-native';
import {Row} from '@expo/ui';
import {NativeHost} from '../host';
import {Surface} from '../surface';
import {spacing} from '../theme';

interface FloatingSurfaceProps extends PropsWithChildren {
  /** The space between the controls. */
  gap: number;
  /** The material the capsule draws on, on the web. */
  material: MaterialThickness;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * iOS and web: a floating bar is the kit's raised capsule, holding its
 * controls as one native row in a host of its own, the width of the controls.
 * On the web the capsule draws on the material, as the surface does.
 */
export function FloatingSurface({gap, material, style, testID, children}: FloatingSurfaceProps) {
  return (
    <Surface raised border="all" radius="pill" material={material} style={[styles.surface, style]} testID={testID}>
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
