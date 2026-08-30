import type {IconToken} from '@/ui/icons';
import type {SFSymbol} from 'sf-symbols-typescript';
import type {ButtonShape, ButtonSize} from './types';

export const ICON_GAP = 8;

export const SIZE_ICON: Record<ButtonSize, number> = {
  small: 16,
  medium: 18,
  large: 20,
};

export const SIZE_TEXT: Record<ButtonSize, number> = {
  small: 13,
  medium: 15,
  large: 17,
};

export function iosSymbol(token: IconToken): SFSymbol {
  const {symbol} = token;
  if (typeof symbol === 'string') return symbol;
  return symbol.ios ?? 'questionmark';
}

export function swiftControlSize(size: ButtonSize) {
  return ({small: 'small', medium: 'regular', large: 'large'} as const)[size];
}

export function swiftBorderShape(shape: ButtonShape) {
  return ({rounded: 'roundedRectangle', pill: 'capsule', circle: 'circle'} as const)[shape];
}

export function androidContentPadding(size: ButtonSize, hasIcon = false) {
  switch (size) {
    case 'small':
      return {start: hasIcon ? 12 : 16, top: 6, end: 16, bottom: 6};
    case 'medium':
      return {start: hasIcon ? 16 : 24, top: 10, end: 24, bottom: 10};
    case 'large':
      return {start: hasIcon ? 20 : 28, top: 14, end: 28, bottom: 14};
  }
}
