import type {BadgeProps} from './types';
import XamlInfoBadge from '../windows/specs/ExpoInterfaceInfoBadgeNativeComponent';
import {useXamlProps} from '../windows';
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
  if (text === null) return null;
  const {dot, color, textColor, testID, style} = props;
  const height = dot ? BADGE_SIZE.dot : BADGE_SIZE.count;
  return (
    <XamlInfoBadge
      value={badgeValue(props)}
      color={color}
      textColor={textColor}
      label={badgeLabel(props, text)}
      style={[{minWidth: height, height}, style]}
      testID={testID}
      {...xaml}
    />
  );
}
