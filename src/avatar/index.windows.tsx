import type {AvatarProps} from './types';
import XamlPersonPicture from '../windows/specs/ExpoInterfacePersonPictureNativeComponent';
import {useXamlProps} from '../windows';
import {colorOf, initialsOf} from './shared';

/**
 * Windows renders a WinUI 3 `PersonPicture` in a XAML island: the platform's
 * own circle of initials, filled with the color the kit hashes from the
 * name so a person keeps their color across platforms.
 */
export function Avatar({name, initials, color, size = 28, testID}: AvatarProps) {
  const {theme} = useXamlProps();
  return (
    <XamlPersonPicture
      initials={initials ?? initialsOf(name)}
      displayName={name}
      color={color ?? colorOf(name)}
      size={size}
      theme={theme}
      style={{width: size, height: size}}
      testID={testID}
    />
  );
}
