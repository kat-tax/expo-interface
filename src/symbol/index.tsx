import type {IconProps} from './types';
import {SymbolView} from 'expo-symbols';
import {TONE_TOKEN, symbolName} from '../icons';
import {useColor} from '../theme';

/**
 * iOS and Android draw an `IconToken` through `expo-symbols`' `SymbolView`:
 * the SF Symbol on iOS (the `.fill` form for a filled token), the Material
 * Symbol on Android. A React Native view, so it goes in a React Native
 * layout; inside a host the controls draw their own icons.
 *
 * Hidden from assistive technology: a glyph on its own says nothing, and the
 * control or row around it carries the name.
 */
export function Icon({icon, size = 24, tone = 'label', tintColor, testID}: IconProps) {
  const toned = useColor(TONE_TOKEN[tone]);
  const ios = symbolName(icon, 'ios');
  const android = symbolName(icon, 'android');
  if (!ios && !android) return null;
  return (
    <SymbolView
      name={{ios: ios as never, android: android as never}}
      size={size}
      tintColor={tintColor ?? toned}
      accessible={false}
      importantForAccessibility="no"
      style={{width: size, height: size}}
      testID={testID}
    />
  );
}

export type {IconProps} from './types';
