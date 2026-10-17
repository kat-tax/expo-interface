import type {IconProps} from './types';
import {SymbolView} from 'expo-symbols';
import {TONE_TOKEN, symbolName} from '../icons';
import {useColor} from '../theme';

/**
 * iOS draws an `IconToken` through `expo-symbols`' `SymbolView`: the SF
 * Symbol, its `.fill` form for a filled token. A React Native view, inside a
 * host as well as outside one. Android has a file of its own, which draws
 * the glyph as Compose content inside a host and as this view outside one.
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
