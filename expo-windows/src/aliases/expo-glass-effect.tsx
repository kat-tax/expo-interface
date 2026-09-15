import type {ReactNode} from 'react';
import type {StyleProp, ViewStyle} from 'react-native';
import {View} from 'react-native';

/**
 * `expo-glass-effect` on Windows: `withWindows` resolves the package to this
 * file. Liquid glass is an iOS material; its Windows analog, acrylic, comes
 * as an island in a later release. Until then a glass view is a plain view
 * with its children, and the feature reports itself unavailable, which is
 * what an app checks before relying on it.
 */
interface GlassProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function GlassView({children, style, testID}: GlassProps) {
  return <View style={style} testID={testID}>{children}</View>;
}

export function GlassContainer({children, style, testID}: GlassProps) {
  return <View style={style} testID={testID}>{children}</View>;
}

export function isLiquidGlassAvailable(): boolean {
  return false;
}
