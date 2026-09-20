import type {TypographyProps} from './types';
import {StyleSheet} from 'react-native';
import {variants, fonts, fontWeights, useColor, flatten, clamp} from '../theme';
import {headingLevel} from './types';

export function Typography({
  children,
  variant = 'body',
  color = 'label',
  weight,
  align,
  numberOfLines,
  level,
  style,
  testID,
}: TypographyProps) {
  const flat = StyleSheet.flatten(style);
  const vars = variants[variant];
  const c = useColor(color);
  // Every title used to be a bare <span>, so a page had no headings at all and
  // nothing to navigate by. The role goes on the same element rather than
  // swapping in an <h1>, which would bring a UA margin and a block box with it.
  const heading = headingLevel(variant, level);
  return (
    <span
      data-testid={testID}
      role={heading ? 'heading' : undefined}
      aria-level={heading}
      style={{
        textAlign: align,
        letterSpacing: vars.letterSpacing,
        lineHeight: `${vars.lineHeight}px`,
        fontSize: vars.fontSize,
        fontWeight: fontWeights[weight ?? vars.fontWeight],
        fontFamily: fonts?.sans,
        display: flat?.flexShrink != null ? 'block' : undefined,
        color: c,
        ...flatten(flat),
        ...clamp(numberOfLines),
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
