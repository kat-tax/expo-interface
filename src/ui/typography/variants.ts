import {Platform} from 'react-native';
import type {TypographyStyle, TypographyVariant} from './types';

type VariantMap = Record<TypographyVariant, TypographyStyle>;

const iosVariants: VariantMap = {
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

const androidVariants: VariantMap = {
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

export const typographyVariants = Platform.select({
  ios: iosVariants,
  android: androidVariants,
  web: iosVariants, // Web uses iOS on purpose
  default: iosVariants,
})!;
