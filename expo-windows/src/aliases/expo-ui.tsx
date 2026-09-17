import type {ReactElement, ReactNode} from 'react';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {Pressable, ScrollView as NativeScrollView, Text as NativeText, View} from 'react-native';

/**
 * `@expo/ui` on Windows: `withWindows` resolves the package to this file.
 * Its universal layout primitives — `Host`, `Column`, `Row`, `Spacer`,
 * `Text`, `List`, `ScrollView`, `RNHostView` — are plain React Native views
 * here, laid out as they ask (a column or row with its spacing and
 * alignment, a spacer that fills, text in its style), so a screen written
 * with them renders on Windows. Its controls — `Button`, `Switch`, `Slider`
 * and the rest — are not here: on Windows those are the kit's, which draws
 * them as WinUI. `modifiers` are SwiftUI's and Compose's, and are ignored.
 */

type Alignment = 'start' | 'center' | 'end';

interface BaseProps {
  style?: StyleProp<ViewStyle>;
  modifiers?: unknown[];
  onPress?: () => void;
  onAppear?: () => void;
  onDisappear?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  testID?: string;
}

interface StackProps extends BaseProps {
  children?: ReactNode;
  alignment?: Alignment;
  spacing?: number;
}

const ALIGN: Record<Alignment, ViewStyle['alignItems']> = {start: 'flex-start', center: 'center', end: 'flex-end'};

/** A view that presses when asked to, and is not there while hidden. */
function Box({children, style, onPress, disabled, hidden, testID}: BaseProps & {children?: ReactNode}) {
  if (hidden) return null;
  if (onPress) {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={style} testID={testID}>
        {children}
      </Pressable>
    );
  }
  return <View style={style} testID={testID}>{children}</View>;
}

function stack(direction: 'row' | 'column', {alignment, spacing, style, ...rest}: StackProps) {
  return <Box {...rest} style={[{flexDirection: direction, gap: spacing, alignItems: alignment && ALIGN[alignment]}, style]}/>;
}

export function Host({children, style, testID}: BaseProps & {children?: ReactNode; matchContents?: boolean; useViewportSizeMeasurement?: boolean}) {
  return <View style={style} testID={testID}>{children}</View>;
}

export function Column(props: StackProps) {
  return stack('column', props);
}

export function Row(props: StackProps) {
  return stack('row', props);
}

export function Spacer({size, flexible, style, hidden, testID}: BaseProps & {size?: number; flexible?: boolean}) {
  if (hidden) return null;
  return <View style={[flexible ? {flex: 1} : {width: size, height: size}, style]} testID={testID}/>;
}

interface UniversalTextStyle {
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  fontFamily?: string;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'right' | 'center';
}

export function Text({children, textStyle, numberOfLines, style, onPress, disabled, hidden, testID}: BaseProps & {children?: string; textStyle?: UniversalTextStyle; numberOfLines?: number}) {
  if (hidden) return null;
  return (
    <NativeText style={[textStyle, style as StyleProp<TextStyle>]} numberOfLines={numberOfLines} onPress={onPress} disabled={disabled} testID={testID}>
      {children}
    </NativeText>
  );
}

export function List({children, testID}: {children?: ReactNode; onRefresh?: () => Promise<void>; testID?: string}) {
  return <View testID={testID}>{children}</View>;
}

export function ScrollView({children, direction, showsIndicators = true, style, hidden, testID}: BaseProps & {children?: ReactNode; direction?: 'vertical' | 'horizontal'; showsIndicators?: boolean}) {
  if (hidden) return null;
  const horizontal = direction === 'horizontal';
  return (
    <NativeScrollView
      horizontal={horizontal}
      showsHorizontalScrollIndicator={horizontal && showsIndicators}
      showsVerticalScrollIndicator={!horizontal && showsIndicators}
      style={style}
      testID={testID}>
      {children}
    </NativeScrollView>
  );
}

export function RNHostView({children, style, hidden, testID}: BaseProps & {children: ReactElement; matchContents?: boolean}) {
  if (hidden) return null;
  return <View style={style} testID={testID}>{children}</View>;
}
