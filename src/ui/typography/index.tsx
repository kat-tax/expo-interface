import type {TextStyle} from 'react-native';
import type {TypographyProps, TypographyWeight} from './types';

import {Text} from 'react-native';
import {typographyVariants} from './variants';
import {fontFamily, resolveTypographyColor} from './shared';

export * from './types';

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
  const v = typographyVariants[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      testID={testID}
      style={[
        {
          fontSize: v.fontSize,
          fontWeight: weightMap[weight ?? v.fontWeight],
          lineHeight: v.lineHeight,
          letterSpacing: v.letterSpacing,
          color: resolveTypographyColor(color),
          fontFamily,
          textAlign: align,
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

const weightMap: Record<TypographyWeight, TextStyle['fontWeight']> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
