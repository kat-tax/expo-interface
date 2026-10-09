import type {MaterialProps} from './types';
import {RoundedRectangle} from '@expo/ui/swift-ui';
import {foregroundStyle, glassEffect} from '@expo/ui/swift-ui/modifiers';
import {Platform, StyleSheet, View} from 'react-native';
import {NativeHost} from '../host';
import {useColor} from '../theme';
import {edgeStyle} from './edge';
import {IOS_MATERIAL} from './shared';

export {materialAttributes, materialProps} from './inert';

/** Liquid Glass, which SwiftUI draws from iOS 26. */
const GLASS = Number.parseInt(String(Platform.Version), 10) >= 26;

/**
 * iOS: the children over a SwiftUI shape filled with the system material
 * (`.thinMaterial`, `.regularMaterial`, `.thickMaterial`), or with Liquid
 * Glass from iOS 26, in a host of its own behind them. The system's
 * material carries its own color, so `fill` is the web's and Android's.
 */
export function Material({kind = 'regular', edge = 'none', radius = 0, style, onLayout, testID, children}: MaterialProps) {
  const separator = useColor('separator');
  const modifiers = GLASS && kind === 'glass'
    ? [foregroundStyle('#00000000'), glassEffect({glass: {variant: 'regular'}, shape: 'roundedRectangle', cornerRadius: radius})]
    : [foregroundStyle({type: 'material', material: IOS_MATERIAL[kind === 'glass' ? 'regular' : kind]})];
  return (
    <View style={[{borderRadius: radius}, edgeStyle(edge, separator), style]} onLayout={onLayout} testID={testID}>
      <NativeHost style={StyleSheet.absoluteFill} pointerEvents="none">
        <RoundedRectangle cornerRadius={radius} modifiers={modifiers}/>
      </NativeHost>
      {children}
    </View>
  );
}

export type {MaterialAttributes, MaterialEdge, MaterialFill, MaterialKind, MaterialProps, MaterialThickness} from './types';
