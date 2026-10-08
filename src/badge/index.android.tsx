import type {BadgeProps} from './types';
import {Badge as ComposeBadge, Text} from '@expo/ui/jetpack-compose';
import {animated, graphicsLayer, testID as testIDModifier, tween} from '@expo/ui/jetpack-compose/modifiers';
import {useNativeHost} from '../host';
import {useBadgeColors} from './colors';
import {DrawnBadge} from './drawn';
import {PULSE_HALF, PULSE_LOW, usePulsePhase} from './pulse';
import {MATERIAL_BADGE, badgeText} from './shared';

/**
 * Inside a native host (a `ListItem`'s slots, a `NativeHost`, `Screen
 * native`) Android shows the Material 3 Compose `Badge`: the real control, so
 * it takes the platform's own shape, its minimum size, and the way it grows
 * from a dot into a capsule as the number does.
 *
 * Outside one a Compose view has no composition to draw in, so the badge is
 * drawn in React Native to Material's geometry instead. Yoga sizes it like any
 * view in the row, its pulse loops on the native driver, and TalkBack reads
 * its `label`.
 *
 * Each is a component of its own, so only the hosted badge paces its pulse
 * from JavaScript and only the drawn one runs a native loop.
 */
export function Badge(props: BadgeProps) {
  const hosted = useNativeHost();
  return hosted ? <HostedBadge {...props}/> : <DrawnBadge {...props} metrics={MATERIAL_BADGE}/>;
}

/**
 * The Compose `Badge`, for a badge inside a host.
 *
 * **TalkBack reads the number alone here**, not the `label`. `@expo/ui`'s
 * Compose layer exposes no modifier that sets a content description — only
 * `Icon` takes one as a prop, and `semantics` takes `contentType` and nothing
 * else — so there is nowhere to put a better name. The drawn badge and the
 * other three platforms announce the label. When a modifier for it lands, this
 * is the first place to use it.
 *
 * Its pulse is paced from JavaScript: `@expo/ui`'s Compose animation specs
 * have no repeating one, so the alpha is told which end to head for each half
 * pulse.
 */
function HostedBadge(props: BadgeProps) {
  const text = badgeText(props);
  const {fill, content} = useBadgeColors(props);
  // A pulse is Compose's to draw: the alpha animates toward each end the phase names.
  const phase = usePulsePhase(props.pulse === true);
  if (text === null) return null;
  const {dot, testID} = props;
  return (
    <ComposeBadge
      containerColor={fill}
      contentColor={content}
      modifiers={[
        ...(props.pulse ? [graphicsLayer({alpha: animated(phase === 'low' ? PULSE_LOW : 1, tween({durationMillis: PULSE_HALF, easing: 'ease'}))})] : []),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}>
      {/* A dot is a badge with nothing in it, which is how Compose draws one.
          The number is in Label Small, the type the badge gives its content:
          @expo/ui's Text passes a style of its own, which would drop it. */}
      {dot ? null : <Text color={content} style={{typography: 'labelSmall'}}>{text}</Text>}
    </ComposeBadge>
  );
}
