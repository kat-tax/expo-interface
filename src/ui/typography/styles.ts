import type {TextStyle} from 'react-native';
import type {CSSProperties} from 'react';
import type {TypographyWeight} from '@/ui/typography/types';
import type {TypographyStyle, TypographyVariant} from './types';

import {Platform} from 'react-native';
import {fonts} from '@/ui/theme';

type VariantMap = Record<TypographyVariant, TypographyStyle>;

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

const iosVars: VariantMap = {
  largeTitle: {fontSize: 34, fontWeight: 'bold', lineHeight: 41, letterSpacing: 0.37},
  title: {fontSize: 28, fontWeight: 'bold', lineHeight: 34, letterSpacing: 0.36},
  title2: {fontSize: 22, fontWeight: 'bold', lineHeight: 28, letterSpacing: 0.35},
  title3: {fontSize: 20, fontWeight: 'semibold', lineHeight: 25, letterSpacing: 0.38},
  headline: {fontSize: 17, fontWeight: 'semibold', lineHeight: 22, letterSpacing: -0.41},
  body: {fontSize: 17, fontWeight: 'normal', lineHeight: 22, letterSpacing: -0.41},
  callout: {fontSize: 16, fontWeight: 'normal', lineHeight: 21, letterSpacing: -0.32},
  subheadline: {fontSize: 15, fontWeight: 'normal', lineHeight: 20, letterSpacing: -0.24},
  footnote: {fontSize: 13, fontWeight: 'normal', lineHeight: 18, letterSpacing: -0.08},
  caption: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  label: {fontSize: 14, fontWeight: 'medium', lineHeight: 18},
};

const androidVars: VariantMap = {
  largeTitle: {fontSize: 32, fontWeight: 'normal', lineHeight: 40},
  title: {fontSize: 28, fontWeight: 'normal', lineHeight: 36},
  title2: {fontSize: 22, fontWeight: 'normal', lineHeight: 28},
  title3: {fontSize: 20, fontWeight: 'medium', lineHeight: 26},
  headline: {fontSize: 16, fontWeight: 'medium', lineHeight: 24},
  body: {fontSize: 16, fontWeight: 'normal', lineHeight: 24},
  callout: {fontSize: 16, fontWeight: 'normal', lineHeight: 24},
  subheadline: {fontSize: 14, fontWeight: 'normal', lineHeight: 20},
  footnote: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  caption: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
  label: {fontSize: 12, fontWeight: 'medium', lineHeight: 16},
};

export const variants = Platform.select({
  web: iosVars,
  ios: iosVars,
  android: androidVars,
  default: iosVars,
});

export const fontFamily = fonts?.sans;

export const fontWeights: Record<
  TypographyWeight,
  TextStyle['fontWeight']
> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const clamp = (linesMax?: number): CSSProperties => {
  if (linesMax === 1) {
    return {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    };
  }
  if (linesMax != null) {
    return {
      display: '-webkit-box',
      overflow: 'hidden',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: linesMax,
    };
  }
  return {};
}

export const flatten = (style?: TextStyle): CSSProperties => {
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
