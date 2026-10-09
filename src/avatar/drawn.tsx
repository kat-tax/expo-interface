import type {AvatarProps} from './types';
import {StyleSheet, Text, View} from 'react-native';
import {onAccent} from '../accent';
import {isColorToken, useColor} from '../theme';
import {AVATAR_RING, AVATAR_TEXT_RATIO, colorOf, initialsOf} from './shared';

/**
 * What a face says to assistive technology in place of the bare name, or
 * nothing at all. Written out rather than picked from `ViewProps`, which
 * declares no `aria-current` or `aria-describedby`.
 */
interface FaceAnnouncement {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  'aria-selected'?: boolean;
  'aria-current'?: boolean;
  'aria-describedby'?: string;
  role?: 'img';
}

/**
 * A person as a colored circle with their initials, drawn in React Native:
 * `Avatar` on iOS and web, and on Android outside a native host (see
 * {@link AvatarProps}).
 */
export function DrawnAvatar({name, initials, color, size, ring, dimmed, testID}: AvatarProps) {
  // Named, not spread: whatever else reaches `Avatar` at run time would be
  // taken for an announcement and land on the circle's view.
  return <AvatarFace name={name} initials={initials} color={color} size={size} ring={ring} dimmed={dimmed} testID={testID}/>;
}

/**
 * The drawn circle, which `AvatarGroup` names or silences: each face of a
 * group on every platform. The circle is its own accessibility element,
 * named for the person, unless the announcement given says otherwise.
 */
export function AvatarFace({name, initials, color, size = 28, ring, dimmed = false, testID, ...announced}: AvatarProps & FaceAnnouncement) {
  const fill = color ?? colorOf(name);
  const token = useColor(ring != null && isColorToken(ring) ? ring : 'background');
  const ringColor = ring == null ? undefined : isColorToken(ring) ? token : ring;
  return (
    <View
      accessible
      accessibilityLabel={name}
      {...announced}
      style={[
        styles.circle,
        {backgroundColor: fill, width: size, height: size, borderRadius: size / 2},
        ringColor != null && {borderWidth: AVATAR_RING, borderColor: ringColor},
        dimmed && styles.dimmed,
      ]}
      testID={testID}>
      <Text
        numberOfLines={1}
        style={[styles.initials, {color: onAccent(fill), fontSize: Math.round(size * AVATAR_TEXT_RATIO)}]}>
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
