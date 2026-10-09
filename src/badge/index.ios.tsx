import type {BadgeProps} from './types';
import {Spacer, Text, ZStack} from '@expo/ui/swift-ui';
import {Animation, accessibilityElement, accessibilityHidden, accessibilityLabel, animation, background, font, foregroundStyle, frame, monospacedDigit, opacity, padding, shapes} from '@expo/ui/swift-ui/modifiers';
import {useNativeHost} from '../host';
import {useBadgeColors} from './colors';
import {DrawnBadge} from './drawn';
import {PULSE_HALF, PULSE_LOW, usePulsePhase} from './pulse';
import {BADGE_FONT_SIZE, UIKIT_BADGE, badgeLabel, badgeText} from './shared';

/**
 * iOS draws the badge rather than hosting one.
 *
 * SwiftUI has a `badge` modifier, and `@expo/ui` exposes it, but it only paints
 * where SwiftUI decides to honour it: inside a `List` row, on a `TabView` item,
 * on a toolbar item. Anywhere else it is accepted and silently does nothing,
 * which is the worst outcome: a badge that compiles, passes its test and is
 * invisible. It belongs on `ListItem` and `Tabs`, where those contexts exist.
 *
 * So this is the capsule UIKit draws: the destructive red, a single digit in a
 * circle, more digits in a capsule, and the accessible name on the view rather
 * than on the number. In a React Native layout it is a React Native view;
 * inside a native host (a `ListItem`'s slots, a `NativeHost`, `Screen native`,
 * a `Sheet`'s native content) it is the same capsule in SwiftUI, as the
 * Android badge is Compose's inside a host.
 *
 * Each is a component of its own, so only the hosted badge paces its pulse
 * from JavaScript and only the drawn one runs a native loop.
 */
export function Badge(props: BadgeProps) {
  const hosted = useNativeHost();
  return hosted ? <HostedBadge {...props}/> : <DrawnBadge {...props} metrics={UIKIT_BADGE}/>;
}

/**
 * The capsule in SwiftUI, for a badge inside a host.
 *
 * A React Native view has no size of its own in SwiftUI: `@expo/ui`'s
 * `ListItem` wraps the row's trailing content in one `RNHostView` that sizes
 * from its first child, so a React Native badge after a SwiftUI text (the
 * row's `value`) draws at no size of its own, stretched to whatever SwiftUI
 * offers. Drawn in SwiftUI it measures itself: the number in the badge's
 * font with its digits monospaced, padded either side, at least a circle wide
 * and a capsule beyond that; the dot a circle of its own size.
 *
 * Its pulse is paced from JavaScript, as the Android badge's is: the opacity
 * is told which end to head for each half pulse, and SwiftUI's `animation`
 * modifier tweens the change, since opacity is animatable and the modifier
 * applies to what comes before it in the chain. With a `label` of `null` it
 * is hidden from VoiceOver, for a parent that speaks for it.
 */
function HostedBadge(props: BadgeProps) {
  const text = badgeText(props);
  const {fill, content} = useBadgeColors(props);
  const phase = usePulsePhase(props.pulse === true);
  if (text === null) return null;
  const {dot, testID} = props;
  const level = phase === 'low' ? PULSE_LOW : 1;
  const common = [
    ...(props.pulse ? [opacity(level), animation(Animation.easeInOut({duration: PULSE_HALF / 1000}), level)] : []),
    // A badge its parent speaks for is hidden from VoiceOver; any other is named.
    ...(props.label === null ? [accessibilityHidden(true)] : [accessibilityLabel(badgeLabel(props, text))]),
  ];
  if (dot) {
    // A filled circle, as the kit draws one in SwiftUI; one element to
    // VoiceOver, named rather than left to its empty content.
    return (
      <ZStack modifiers={[frame({width: UIKIT_BADGE.dot, height: UIKIT_BADGE.dot}), background(fill, shapes.circle()), accessibilityElement('ignore'), ...common]} testID={testID}>
        <Spacer/>
      </ZStack>
    );
  }
  return (
    <Text
      modifiers={[
        font({size: BADGE_FONT_SIZE, weight: 'semibold'}),
        // The number must not reflow when the count changes from 1 to 7.
        monospacedDigit(),
        foregroundStyle({type: 'color', color: content}),
        padding({horizontal: UIKIT_BADGE.padding}),
        frame({minWidth: UIKIT_BADGE.count, height: UIKIT_BADGE.count}),
        background(fill, shapes.capsule()),
        ...common,
      ]}
      testID={testID}>
      {text}
    </Text>
  );
}
