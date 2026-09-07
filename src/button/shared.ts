import type {IconToken} from '../icons';
import type {SFSymbol} from 'expo-symbols';
import type {ButtonShape, ButtonSize} from './types';

export const ICON_GAP = 8;

export const SIZE_ICON: Record<ButtonSize, number> = {
  inline: 20,
  small: 16,
  medium: 18,
  large: 20,
};

export const SIZE_TEXT: Record<ButtonSize, number> = {
  inline: 15,
  small: 13,
  medium: 15,
  large: 17,
};

/**
 * The SF Symbol a token names on iOS. SF Symbols keeps the solid form of a
 * symbol under its own `.fill` name, so a filled token is that name with the
 * suffix — unless it already carries one, which lets a token name an exact
 * symbol (`star.slash.fill`) and keep it.
 */
export function iosSymbol(token: IconToken): SFSymbol {
  const {symbol, fill} = token;
  const name = typeof symbol === 'string' ? symbol : symbol.ios ?? 'questionmark';
  return fill && !name.endsWith('.fill') ? `${name}.fill` as SFSymbol : name;
}

export function swiftControlSize(size: ButtonSize) {
  return ({inline: 'small', small: 'small', medium: 'regular', large: 'large'} as const)[size];
}

export function swiftBorderShape(shape: ButtonShape) {
  return ({rounded: 'roundedRectangle', pill: 'capsule', circle: 'circle'} as const)[shape];
}

export function androidContentPadding(size: ButtonSize, hasIcon = false) {
  switch (size) {
    case 'inline':
      return {start: 0, top: 0, end: 0, bottom: 0};
    case 'small':
      return {start: hasIcon ? 12 : 16, top: 6, end: 16, bottom: 6};
    case 'medium':
      return {start: hasIcon ? 16 : 24, top: 10, end: 24, bottom: 10};
    case 'large':
      return {start: hasIcon ? 20 : 28, top: 14, end: 28, bottom: 14};
  }
}
