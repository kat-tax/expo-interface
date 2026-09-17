import type {ReactNode, RefObject} from 'react';
import type {ColorValue, StyleProp, View as NativeView, ViewProps, ViewStyle} from 'react-native';
import {View} from 'react-native';

/**
 * `expo-blur` and `expo-mesh-gradient` on Windows: the blur is a tinted,
 * translucent surface over what is behind it — WinUI's acrylic paints
 * white inside an island — and the mesh gradient is the first colour, or a
 * two-colour blend of the corners drawn as bands. A stand-in each, so a
 * screen with them composes; the effect itself is another platform's.
 */

export type BlurTint = 'light' | 'dark' | 'default' | 'extraLight' | 'regular' | 'prominent' | 'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemChromeMaterial' | string;

export interface BlurViewProps extends ViewProps {
  tint?: BlurTint;
  intensity?: number;
  blurReductionFactor?: number;
  blurMethod?: string;
  experimentalBlurMethod?: string;
  blurTarget?: RefObject<NativeView | null>;
}

/** The colour a tint stands for, at the intensity's opacity. */
export function tintColor(tint: BlurTint = 'default', intensity = 50): string {
  const alpha = Math.max(0, Math.min(1, intensity / 100)) * 0.85;
  const dark = /dark|Dark/.test(tint);
  return dark ? `rgba(20,20,20,${alpha.toFixed(3)})` : `rgba(255,255,255,${alpha.toFixed(3)})`;
}

export function BlurView({tint, intensity, style, children, ...rest}: BlurViewProps) {
  return (
    <View {...rest} style={[{backgroundColor: tintColor(tint, intensity)}, style]}>
      {children}
    </View>
  );
}

export function BlurTargetView({children, ...rest}: ViewProps & {ref?: RefObject<NativeView | null>}) {
  return <View {...rest}>{children}</View>;
}

export interface MeshGradientViewProps extends ViewProps {
  columns?: number;
  rows?: number;
  points?: number[][];
  colors?: ColorValue[];
  smoothsColors?: boolean;
  ignoresSafeArea?: boolean;
  mask?: boolean;
  resolution?: {x?: number; y?: number};
  children?: ReactNode;
}

/** The colours as horizontal bands: the mesh's rows, flat. */
export function bandsOf(colors: ColorValue[] = [], rows = 1): ColorValue[] {
  if (!colors.length) return [];
  const perRow = Math.max(1, Math.ceil(colors.length / Math.max(1, rows)));
  const bands: ColorValue[] = [];
  for (let start = 0; start < colors.length; start += perRow) bands.push(colors[start]);
  return bands;
}

export function MeshGradientView({colors, rows, style, children, ...rest}: MeshGradientViewProps) {
  const bands = bandsOf(colors, rows);
  const base: StyleProp<ViewStyle> = [{overflow: 'hidden'}, style];
  return (
    <View {...rest} style={base}>
      <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
        {bands.map((color, index) => (
          <View key={index} style={{flex: 1, backgroundColor: color}}/>
        ))}
      </View>
      {children}
    </View>
  );
}
