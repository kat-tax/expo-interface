import type {TypographyProps} from './types';
import type {TextProps} from 'react-native';
import {createElement} from 'react';
import {useColor, variants, fonts, fontWeights} from '../theme';
import {headingLevel} from './types';

const Text = (props: TextProps) => createElement('RCTText', props);

export function Typography({
  children,
  variant = 'body',
  color = 'label',
  weight,
  align,
  style,
  numberOfLines,
  level,
  testID,
}: TypographyProps) {
  const v = variants[variant];
  const c = useColor(color);
  // A heading is something VoiceOver and TalkBack can jump between; without
  // the role every title was just more text on the screen.
  const heading = headingLevel(variant, level);
  return (
    <Text
      numberOfLines={numberOfLines}
      accessibilityRole={heading ? 'header' : undefined}
      testID={testID}
      style={[
        {
          textAlign: align,
          letterSpacing: v.letterSpacing,
          lineHeight: v.lineHeight,
          fontSize: v.fontSize,
          fontWeight: fontWeights[weight ?? v.fontWeight],
          fontFamily: fonts.sans,
          color: c,
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
