import type {IconProps} from './types';
import {Icon as ComposeIcon} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {SymbolView} from 'expo-symbols';
import {useNativeHost} from '../host';
import {TONE_TOKEN, drawableOf, symbolName} from '../icons';
import {useColor} from '../theme';

/**
 * Android draws an `IconToken` in whichever toolkit is around it.
 *
 * Inside a native host (a `ListItem`'s slots, a `NativeHost`, `Screen
 * native`) it is Compose content: Material's `Icon` with the token's
 * drawable, as the controls draw theirs, so it can stand at either end of a
 * row. A React Native view there would be hosted inside the composition,
 * and a lazy `List` hosts it again each time it recycles the row, which
 * ends the app ("The specified child already has a parent"). A token with
 * no drawable draws nothing there, as a `Chip`'s icon does.
 *
 * Outside one a Compose view has no composition to draw in, so the glyph is
 * `expo-symbols`' `SymbolView`, the Material Symbol from its font. The kit's
 * own React Native content inside a host (a `Sheet`'s capped body and
 * footer, an `EmptyState`'s node) says it is outside one. A React Native
 * view of the app's own placed among native content cannot: `@expo/ui`
 * hosts it natively, in `addView`, and nothing in React's tree marks the
 * boundary, so an icon inside one is Compose content with no composition
 * and draws nothing.
 *
 * Hidden from TalkBack either way: the Compose icon has no content
 * description, which Material reads as decorative, and the view is not
 * accessible. The control or row around it carries the name.
 */
export function Icon({icon, size = 24, tone = 'label', tintColor, testID}: IconProps) {
  const hosted = useNativeHost();
  const toned = useColor(TONE_TOKEN[tone]);
  const tint = tintColor ?? toned;
  if (hosted) {
    const drawable = drawableOf(icon);
    if (!drawable) return null;
    return <ComposeIcon source={drawable} size={size} tint={tint} modifiers={testID ? [testIDModifier(testID)] : undefined}/>;
  }
  const ios = symbolName(icon, 'ios');
  const android = symbolName(icon, 'android');
  if (!ios && !android) return null;
  return (
    <SymbolView
      name={{ios: ios as never, android: android as never}}
      size={size}
      tintColor={tint}
      accessible={false}
      importantForAccessibility="no"
      style={{width: size, height: size}}
      testID={testID}
    />
  );
}

export type {IconProps} from './types';
