import type {TypographyProps} from './types';
import * as theme from '@/ui/theme';
import {Text} from 'react-native';

export function Typography({
  children,
  variant = 'body',
  color = 'label',
  weight,
  align,
  style,
  numberOfLines,
  testID,
}: TypographyProps) {
  const v = theme.variants[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      testID={testID}
      style={[
        {
          textAlign: align,
          letterSpacing: v.letterSpacing,
          lineHeight: v.lineHeight,
          fontSize: v.fontSize,
          fontWeight: theme.fontWeights[weight ?? v.fontWeight],
          fontFamily: theme.fonts.sans,
          color: theme.getVal(color),
        },
        style,
      ]}>
      {children}
    </Text>
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
