import type {AvatarProps} from './types';
import {StyleSheet, Text, View} from 'react-native';
import {onAccent} from '../accent';
import {isColorToken, useColor} from '../theme';
import {AVATAR_RING, colorOf, initialsOf} from './shared';

/** Text size that keeps the initials inside the circle at any diameter. */
const TEXT_RATIO = 0.4;

/**
 * A person as a colored circle with their initials, drawn in React Native:
 * `Avatar` on iOS, Android and web, and each face of an `AvatarGroup`
 * everywhere (see {@link AvatarProps}).
 */
export function DrawnAvatar({name, initials, color, size = 28, ring, dimmed = false, testID}: AvatarProps) {
  const fill = color ?? colorOf(name);
  const token = useColor(ring != null && isColorToken(ring) ? ring : 'background');
  const ringColor = ring == null ? undefined : isColorToken(ring) ? token : ring;
  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[
        styles.circle,
        {backgroundColor: fill, width: size, height: size, borderRadius: size / 2},
        ringColor != null && {borderWidth: AVATAR_RING, borderColor: ringColor},
        dimmed && styles.dimmed,
      ]}
      testID={testID}>
      <Text
        numberOfLines={1}
        style={[styles.initials, {color: onAccent(fill), fontSize: Math.round(size * TEXT_RATIO)}]}>
        {initials ?? initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.5,
  },
});
