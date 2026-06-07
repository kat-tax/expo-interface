import type {StyleProp, TextStyle} from 'react-native';
import type {ReactNode} from 'react';
import type {ColorTokens} from '@/ui/theme';

export type TypographyVariant =
  | 'largeTitle'
  | 'title'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption'
  | 'label';

export type TypographyWeight =
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold';

export type TypographyAlign =
  | 'left'
  | 'center'
  | 'right';

export interface TypographyStyle {
  fontSize: number;
  fontWeight: TypographyWeight;
  lineHeight: number;
  letterSpacing?: number;
}

export interface TypographyProps {
  children: ReactNode;
  variant?: TypographyVariant;
  color?: ColorTokens | (string & {});
  weight?: TypographyWeight;
  align?: TypographyAlign;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
}
