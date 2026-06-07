import type {CSSProperties} from 'react';
import type {TypographyProps, TypographyWeight} from './types';
import type {TextStyle} from 'react-native';
import {StyleSheet} from 'react-native';

import {fontFamily, resolveTypographyColor} from './shared';
import {getVariantStyle} from './variants';

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
  const variantStyle = getVariantStyle(variant);
  const flatStyle = StyleSheet.flatten(style);
  const layoutStyle = toSpanStyle(flatStyle);
  const spanStyle: CSSProperties = {
    display: flatStyle?.flexShrink != null ? 'block' : undefined,
    fontSize: variantStyle.fontSize,
    fontWeight: weightMap[weight ?? variantStyle.fontWeight],
    lineHeight: `${variantStyle.lineHeight}px`,
    letterSpacing: variantStyle.letterSpacing,
    color: resolveTypographyColor(color) as string,
    fontFamily,
    textAlign: align,
    ...layoutStyle,
    ...(numberOfLines === 1
      ? {overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}
      : numberOfLines != null
        ? {
            display: '-webkit-box',
            WebkitLineClamp: numberOfLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }
        : {}),
  };

  return (
    <span style={spanStyle} data-testid={testID}>
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

const weightMap: Record<TypographyWeight, CSSProperties['fontWeight']> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

function toSpanStyle(style: TextStyle | undefined): CSSProperties {
  if (!style) return {};
  const css: CSSProperties = {};
  if (typeof style.opacity === 'number') css.opacity = style.opacity;
  if (style.flexShrink != null) css.flexShrink = style.flexShrink;
  if (style.flexGrow != null) css.flexGrow = style.flexGrow;
  if (style.margin != null) css.margin = style.margin as CSSProperties['margin'];
  if (style.marginTop != null) css.marginTop = style.marginTop as CSSProperties['marginTop'];
  if (style.marginRight != null) css.marginRight = style.marginRight as CSSProperties['marginRight'];
  if (style.marginBottom != null) css.marginBottom = style.marginBottom as CSSProperties['marginBottom'];
  if (style.marginLeft != null) css.marginLeft = style.marginLeft as CSSProperties['marginLeft'];
  if (style.padding != null) css.padding = style.padding as CSSProperties['padding'];
  if (style.paddingTop != null) css.paddingTop = style.paddingTop as CSSProperties['paddingTop'];
  if (style.paddingRight != null) css.paddingRight = style.paddingRight as CSSProperties['paddingRight'];
  if (style.paddingBottom != null) css.paddingBottom = style.paddingBottom as CSSProperties['paddingBottom'];
  if (style.paddingLeft != null) css.paddingLeft = style.paddingLeft as CSSProperties['paddingLeft'];
  if (style.minWidth != null) css.minWidth = style.minWidth as CSSProperties['minWidth'];
  if (style.maxWidth != null) css.maxWidth = style.maxWidth as CSSProperties['maxWidth'];
  if (style.width != null) css.width = style.width as CSSProperties['width'];
  if (style.marginHorizontal != null) {
    css.marginLeft = style.marginHorizontal as CSSProperties['marginLeft'];
    css.marginRight = style.marginHorizontal as CSSProperties['marginRight'];
  }
  if (style.marginVertical != null) {
    css.marginTop = style.marginVertical as CSSProperties['marginTop'];
    css.marginBottom = style.marginVertical as CSSProperties['marginBottom'];
  }
  if (style.paddingHorizontal != null) {
    css.paddingLeft = style.paddingHorizontal as CSSProperties['paddingLeft'];
    css.paddingRight = style.paddingHorizontal as CSSProperties['paddingRight'];
  }
  if (style.paddingVertical != null) {
    css.paddingTop = style.paddingVertical as CSSProperties['paddingTop'];
    css.paddingBottom = style.paddingVertical as CSSProperties['paddingBottom'];
  }
  return css;
}
