import type {AvatarProps} from './types';
import {StyleSheet, Text, View} from 'react-native';
import {onAccent} from '../accent';
import {colorOf, initialsOf} from './shared';

/** Text size that keeps the initials inside the circle at any diameter. */
const TEXT_RATIO = 0.4;

/**
 * A person as a colored circle with their initials (see {@link AvatarProps}).
 */
export function Avatar({name, initials, color, size = 28, testID}: AvatarProps) {
  const fill = color ?? colorOf(name);
  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[styles.circle, {backgroundColor: fill, width: size, height: size, borderRadius: size / 2}]}
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
});
