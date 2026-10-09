import type {BadgeProps} from './types';
import type {BadgeMetrics} from './shared';
import {Animated, StyleSheet, Text, type ViewProps} from 'react-native';
import {useBadgeColors} from './colors';
import {usePulseOpacity} from './pulse';
import {BADGE_FONT_SIZE, badgeLabel, badgeText} from './shared';

/**
 * The badge drawn in React Native to a platform's geometry: on iOS and
 * Android outside a native host, where neither toolkit has anything to draw
 * in. A single digit sits in a circle and more digits in a capsule. The
 * accessible name is on the view rather than on the number, and a pulse
 * loops the view's opacity on the native driver. With a `label` of `null`
 * the badge is no element at all, hidden with its number from assistive
 * technology, for a parent that speaks for it.
 */
export function DrawnBadge({metrics, ...props}: BadgeProps & {metrics: BadgeMetrics}) {
  const text = badgeText(props);
  const {fill, content} = useBadgeColors(props);
  const opacity = usePulseOpacity(props.pulse === true);
  if (text === null) return null;
  const {dot, testID, style} = props;
  const size = dot ? metrics.dot : metrics.count;
  // A badge its parent speaks for is no element of its own: on Android an
  // accessible view inside another is a stop of its own, so the parent and
  // then the badge would each be read.
  const announced: ViewProps = props.label === null
    ? {accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true}
    : {accessible: true, accessibilityRole: 'text', accessibilityLabel: badgeLabel(props, text)};
  return (
    <Animated.View
      {...announced}
      style={[
        styles.badge,
        {backgroundColor: fill, minWidth: size, height: size, borderRadius: size / 2, paddingHorizontal: dot ? 0 : metrics.padding, opacity},
        style,
      ]}
      testID={testID}>
      {dot ? null : (
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[styles.text, {color: content, fontWeight: metrics.fontWeight, lineHeight: metrics.lineHeight, letterSpacing: metrics.letterSpacing}]}>
          {text}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: BADGE_FONT_SIZE,
    // The number must not reflow when the count changes from 1 to 7.
    fontVariant: ['tabular-nums'],
    // Android pads a line for accents above and below; without it the digits
    // sit low in the 16 dp box. iOS has no such padding and ignores it.
    includeFontPadding: false,
  },
});
