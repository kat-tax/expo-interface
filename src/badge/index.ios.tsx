import type {BadgeProps} from './types';
import {StyleSheet, Text, View} from 'react-native';
import {onAccent} from '../accent';
import {useColor} from '../theme';
import {BADGE_FONT_SIZE, BADGE_PADDING, BADGE_SIZE, badgeLabel, badgeText} from './shared';

/**
 * iOS draws the badge rather than hosting one.
 *
 * SwiftUI has a `badge` modifier, and `@expo/ui` exposes it, but it only paints
 * where SwiftUI decides to honour it: inside a `List` row, on a `TabView` item,
 * on a toolbar item. Anywhere else it is accepted and silently does nothing,
 * which is the worst outcome — a badge that compiles, passes its test and is
 * invisible. It belongs on `ListItem` and `Tabs`, where those contexts exist.
 *
 * So this is the capsule UIKit draws: the destructive red, a single digit in a
 * circle, more digits in a capsule, and the accessible name on the view rather
 * than on the number.
 */
export function Badge(props: BadgeProps) {
  const text = badgeText(props);
  const destructive = useColor('destructive');
  if (text === null) return null;
  const {dot, color, textColor, testID, style} = props;
  const fill = color ?? destructive;
  const size = dot ? BADGE_SIZE.dot : BADGE_SIZE.count;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={badgeLabel(props, text)}
      style={[
        styles.badge,
        {backgroundColor: fill, minWidth: size, height: size, borderRadius: size / 2},
        dot ? styles.dot : null,
        style,
      ]}
      testID={testID}>
      {dot ? null : (
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[styles.text, {color: textColor ?? onAccent(fill)}]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: BADGE_PADDING,
  },
  dot: {
    paddingHorizontal: 0,
  },
  text: {
    fontSize: BADGE_FONT_SIZE,
    fontWeight: '600',
    // The number must not reflow when the count changes from 1 to 7.
    fontVariant: ['tabular-nums'],
    lineHeight: BADGE_FONT_SIZE + 1,
  },
});
