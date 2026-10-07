import type {MaterialKind, MaterialProps} from './types';
import {useId} from 'react';
import {StyleSheet, View} from 'react-native';
import {useColor} from '../theme';
import {splitPadding} from '../windows/aliases/expo-glass-effect';
import {useXamlProps} from '../windows/index';
import {Portal} from '../windows/portal';
import XamlMaterial from '../windows/specs/ExpoInterfaceMaterialNativeComponent';
import {edgeStyle} from './edge';

export {materialProps} from './inert';

/** Windows' acrylic for each thickness; Liquid Glass is the default acrylic. */
const ACRYLIC: Record<MaterialKind, 'acrylicThin' | 'acrylic' | 'acrylicBase'> = {
  thin: 'acrylicThin',
  regular: 'acrylic',
  thick: 'acrylicBase',
  glass: 'acrylic',
};

/**
 * Windows: the children on acrylic, as `expo-glass-effect`'s `GlassView` is
 * drawn here: an `ExpoInterfaceMaterial` island with the system backdrop and
 * the children inside it through a portal, since an island draws above the
 * React Native content beside it. The system's acrylic carries its own
 * color, so `fill` is the web's and Android's. The padding goes to the
 * content; a corner radius rounds the box, not the backdrop, which the
 * platform draws to the island's rectangle.
 */
export function Material({kind = 'regular', edge = 'none', radius, style, onLayout, testID, children}: MaterialProps) {
  const slot = useId();
  const look = useXamlProps();
  const separator = useColor('separator');
  const [box, content] = splitPadding(style);
  return (
    <View style={[styles.box, {borderRadius: radius}, edgeStyle(edge, separator), box]} onLayout={onLayout} testID={testID}>
      <XamlMaterial slot={slot} material={ACRYLIC[kind]} accentColor={look.accentColor} theme={look.theme} style={styles.material}/>
      <Portal slot={slot}>
        <View style={content}>{children}</View>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
  material: {
    alignSelf: 'stretch',
  },
});

export type {MaterialEdge, MaterialFill, MaterialKind, MaterialProps} from './types';
