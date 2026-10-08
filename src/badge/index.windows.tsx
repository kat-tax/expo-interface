import type {BadgeProps} from './types';
import {Animated} from 'react-native';
import {hexColor} from '../hex-color';
import XamlInfoBadge from '../windows/specs/ExpoInterfaceInfoBadgeNativeComponent';
import {useXamlProps} from '../windows';
import {useBadgeColors} from './colors';
import {usePulseOpacity} from './pulse';
import {BADGE_SIZE, badgeLabel, badgeText, badgeValue} from './shared';

/**
 * Windows hosts a WinUI 3 `InfoBadge` — the platform's own badge, so it takes
 * Fluent's shape, its minimum size and its type ramp rather than a drawn
 * approximation of them.
 *
 * `InfoBadge` holds a number and nothing else: it has a `Value` and an
 * `IconSource`, and no content of its own. So an overflowing count reads as
 * the cap (`99`) here where the other three draw `99+`. The accessible name
 * carries the true wording, which is the part that matters for anyone who
 * cannot see either.
 *
 * The island is sized here rather than left to the control, because a badge
 * sits in a row beside other things and Yoga needs a width before XAML has
 * measured anything.
 */
export function Badge(props: BadgeProps) {
  const text = badgeText(props);
  const xaml = useXamlProps();
  const {fill, content} = useBadgeColors(props);
  const opacity = usePulseOpacity(props.pulse === true);
  if (text === null) return null;
  const {dot, color, textColor, testID, style} = props;
  const height = dot ? BADGE_SIZE.dot : BADGE_SIZE.count;
  // The island parses hex alone, so a name, `rgb()` or a translucent token is
  // written as hex for it. Without a color of the caller's the control keeps
  // Fluent's critical fill and picks black or white for it, unless told a text
  // color. With one, the number's color is worked out here as on the other
  // platforms, a translucent fill as it shows over the screen's background:
  // the island would judge the fill without its alpha.
  const badge = (
    <XamlInfoBadge
      value={badgeValue(props)}
      color={color === undefined ? undefined : hexColor(fill)}
      textColor={hexColor(color === undefined ? textColor : content)}
      label={badgeLabel(props, text)}
      style={[{minWidth: height, height}, style]}
      testID={testID}
      {...xaml}
    />
  );
  // The island pulses with the view around it, whose opacity its visual takes.
  return props.pulse ? <Animated.View style={{opacity}}>{badge}</Animated.View> : badge;
}
