import type {TypographyProps} from './types';
import {StyleSheet} from 'react-native';
import * as theme from '@/ui/theme';

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
  const flat = StyleSheet.flatten(style);
  const vars = theme.variants[variant];
  return (
    <span
      data-testid={testID}
      style={{
        textAlign: align,
        letterSpacing: vars.letterSpacing,
        lineHeight: `${vars.lineHeight}px`,
        fontSize: vars.fontSize,
        fontWeight: theme.fontWeights[weight ?? vars.fontWeight],
        fontFamily: theme.fonts?.sans,
        display: flat?.flexShrink != null ? 'block' : undefined,
        color: theme.getVal(color),
        ...theme.flatten(flat),
        ...theme.clamp(numberOfLines),
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
