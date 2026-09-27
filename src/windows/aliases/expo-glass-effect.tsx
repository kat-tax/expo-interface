import type {StyleProp, ViewProps, ViewStyle} from 'react-native';
import {useId} from 'react';
import {processColor, StyleSheet, View} from 'react-native';
import XamlMaterial from '../specs/ExpoInterfaceMaterialNativeComponent';
import {useXamlProps} from '../index';
import {Portal} from '../portal';

/**
 * `expo-glass-effect` on Windows. Liquid glass is iOS's material; the
 * platform's own are acrylic and Mica, and a `GlassView` is drawn on acrylic:
 * an `ExpoInterfaceMaterial` island with the system backdrop, the children
 * inside it through a portal (see `../portal.tsx`), in the same React tree.
 * Inside, because an island draws above whatever React Native content lies
 * beside it, whichever came first. `regular` is the default acrylic, `clear`
 * the thin kind, and `none` a plain view. The tint lies over the material.
 * The view's padding goes to the content; the rest of its style, the box.
 * A corner radius rounds the box's own paint, not the material: the platform
 * draws a backdrop to the island's rectangle.
 *
 * Glass is available, since the platform draws it: an app that checks before
 * choosing between a glass view and a fallback gets the material.
 */

export type GlassStyle = 'clear' | 'regular' | 'none';

export type GlassEffectStyleConfig = {
  style: GlassStyle;
  animate?: boolean;
  animationDuration?: number;
};

export type GlassColorScheme = 'auto' | 'light' | 'dark';

export type GlassViewProps = {
  glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
  tintColor?: string;
  /** iOS's interactive glass has no Windows counterpart; the material is the same either way. */
  isInteractive?: boolean;
  colorScheme?: GlassColorScheme;
} & ViewProps;

export type GlassContainerProps = {
  /** iOS's glass shapes merge within this distance; Windows' materials stay apart. */
  spacing?: number;
} & ViewProps;

const MATERIAL = {regular: 'acrylic', clear: 'acrylicThin'} as const;

const PADDING: readonly (keyof ViewStyle)[] = ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingStart', 'paddingEnd', 'paddingHorizontal', 'paddingVertical'];

/** The style split into the box's part and the content's (the padding). */
export function splitPadding(style: StyleProp<ViewStyle>): [ViewStyle, ViewStyle] {
  const flat = StyleSheet.flatten(style) ?? {};
  const box: ViewStyle = {};
  const content: ViewStyle = {};
  for (const [key, value] of Object.entries(flat) as [keyof ViewStyle, unknown][]) {
    (PADDING.includes(key) ? content : box)[key as 'padding'] = value as number;
  }
  return [box, content];
}

/** A color in any form React Native accepts as `#RRGGBBAA`, which is what the island parses. */
export function hexColor(color: string | undefined): string | undefined {
  const argb = color == null ? null : processColor(color);
  if (typeof argb !== 'number') return undefined;
  const rgba = ((argb << 8) | (argb >>> 24)) >>> 0;
  return `#${rgba.toString(16).padStart(8, '0').toUpperCase()}`;
}

export function GlassView({glassEffectStyle = 'regular', tintColor, colorScheme = 'auto', isInteractive: _interactive, style, children, ...rest}: GlassViewProps) {
  const slot = useId();
  const look = useXamlProps();
  const glass = typeof glassEffectStyle === 'string' ? glassEffectStyle : glassEffectStyle.style;
  if (glass === 'none') {
    return <View style={style} {...rest}>{children}</View>;
  }
  const [box, content] = splitPadding(style);
  return (
    <View style={[box, styles.box]} {...rest}>
      <XamlMaterial
        slot={slot}
        material={MATERIAL[glass]}
        tintColor={hexColor(tintColor)}
        accentColor={look.accentColor}
        theme={colorScheme === 'auto' ? look.theme : colorScheme}
        style={styles.material}
      />
      <Portal slot={slot}>
        <View style={content}>{children}</View>
      </Portal>
    </View>
  );
}

export function GlassContainer({spacing: _spacing, children, ...rest}: GlassContainerProps) {
  return <View {...rest}>{children}</View>;
}

export function isLiquidGlassAvailable(): boolean {
  return true;
}

export function isGlassEffectAPIAvailable(): boolean {
  return true;
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
  material: {
    alignSelf: 'stretch',
  },
});
