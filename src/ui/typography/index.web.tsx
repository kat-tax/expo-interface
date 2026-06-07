import type {CSSProperties} from 'react';
import type {TextStyle} from 'react-native';
import type {TypographyProps, TypographyWeight} from './types';

import {StyleSheet} from 'react-native';
import {typographyVariants} from './variants';
import {fontFamily, resolveTypographyColor} from './shared';

export * from './types';

export function Typography({
  children,
  variant = 'body',
  color = 'label',
  weight,
  align,
  numberOfLines,
  style,
  testID,
}: TypographyProps) {
  const rnStyle = StyleSheet.flatten(style);
  const webStyle = typographyVariants[variant];
  return (
    <span
      data-testid={testID}
      style={{
        display: rnStyle?.flexShrink != null ? 'block' : undefined,
        lineHeight: `${webStyle.lineHeight}px`,
        letterSpacing: webStyle.letterSpacing,
        fontWeight: WEIGHT_MAP[weight ?? webStyle.fontWeight],
        fontSize: webStyle.fontSize,
        fontFamily,
        textAlign: align,
        color: resolveTypographyColor(color) as string,
        ...toWebStyle(rnStyle),
        ...clampStyle(numberOfLines),
      }}>
      {children}
    </span>
  );
}

export function LargeTitle(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="largeTitle" {...props}/>;
}

export function Title(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="title" {...props}/>;
}

export function Title2(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="title2" {...props}/>;
}

export function Title3(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="title3" {...props}/>;
}

export function Headline(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="headline" {...props}/>;
}

export function Body(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="body" {...props}/>;
}

export function Callout(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="callout" {...props}/>;
}

export function Subheadline(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="subheadline" {...props}/>;
}

export function Footnote(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="footnote" {...props}/>;
}

export function Caption(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="caption" {...props}/>;
}

export function Label(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="label" {...props}/>;
}

const WEIGHT_MAP: Record<TypographyWeight, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

const VALID_KEYS = [
  // Position
  'flexGrow',
  'flexShrink',
  // Dimension
  'width',
  'minWidth',
  'maxWidth',
  // Spacing
  'margin',
  'marginTop',
  'marginLeft',
  'marginRight',
  'marginBottom',
  'padding',
  'paddingTop',
  'paddingLeft',
  'paddingRight',
  'paddingBottom',
] as const;

const EXPAND_KEYS = {
  marginVertical: ['marginTop', 'marginBottom'],
  marginHorizontal: ['marginLeft', 'marginRight'],
  paddingVertical: ['paddingTop', 'paddingBottom'],
  paddingHorizontal: ['paddingLeft', 'paddingRight'],
} as const;

const clampStyle = (numberOfLines?: number): CSSProperties => {
  if (numberOfLines === 1) {
    return {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    };
  }
  if (numberOfLines != null) {
    return {
      display: '-webkit-box',
      overflow: 'hidden',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: numberOfLines,
    };
  }
  return {};
}

const toWebStyle = (style?: TextStyle): CSSProperties => {
  if (!style) return {};
  const css: CSSProperties = {};
  if (typeof style.opacity === 'number')
    css.opacity = style.opacity;
  for (const key of VALID_KEYS) {
    if (style[key] != null)
      css[key] = style[key] as never;
  }
  for (const [k,v] of Object.entries(EXPAND_KEYS)) {
    const x = style[k as keyof TextStyle];
    if (x == null) continue;
    for (const s of v)
      css[s] = x as never;
  }
  return css;
}
