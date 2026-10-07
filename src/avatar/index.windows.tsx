import type {AvatarProps} from './types';
import {View} from 'react-native';
import XamlPersonPicture from '../windows/specs/ExpoInterfacePersonPictureNativeComponent';
import {useXamlProps} from '../windows';
import {isColorToken, useColor} from '../theme';
import {AVATAR_RING, colorOf, initialsOf} from './shared';

/**
 * Windows renders a WinUI 3 `PersonPicture` in a XAML island: the platform's
 * own circle of initials, filled with the color the kit hashes from the
 * name so a person keeps their color across platforms. A ring is the view
 * around the island, with the picture inside it at the size less the ring;
 * `dimmed` is that view's opacity, which the island's visual takes.
 */
export function Avatar({name, initials, color, size = 28, ring, dimmed = false, testID}: AvatarProps) {
  const {theme} = useXamlProps();
  const token = useColor(ring != null && isColorToken(ring) ? ring : 'background');
  const ringColor = ring == null ? undefined : isColorToken(ring) ? token : ring;
  const inner = ringColor == null ? size : size - 2 * AVATAR_RING;
  const picture = (
    <XamlPersonPicture
      initials={initials ?? initialsOf(name)}
      displayName={name}
      color={color ?? colorOf(name)}
      size={inner}
      theme={theme}
      style={{width: inner, height: inner}}
      testID={testID}
    />
  );
  if (ringColor == null && !dimmed) return picture;
  return (
    <View
      style={[
        ringColor != null && {width: size, height: size, borderRadius: size / 2, borderWidth: AVATAR_RING, borderColor: ringColor},
        dimmed && {opacity: 0.5},
      ]}>
      {picture}
    </View>
  );
}

export {AvatarGroup} from './group';
export type {AvatarGroupPerson, AvatarGroupProps, AvatarProps} from './types';
