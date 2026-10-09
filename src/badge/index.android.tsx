import type {BadgeProps} from './types';
import {Box, Badge as ComposeBadge, Text} from '@expo/ui/jetpack-compose';
import {align, animated, graphicsLayer, size, testID as testIDModifier, tween} from '@expo/ui/jetpack-compose/modifiers';
import {useNativeHost} from '../host';
import {useBadgeColors} from './colors';
import {DrawnBadge} from './drawn';
import {PULSE_HALF, PULSE_LOW, usePulsePhase} from './pulse';
import {MATERIAL_BADGE, badgeLabel, badgeText, badgeWordsAfter} from './shared';

/** The label's text in a hosted badge: there for TalkBack, not to be seen. */
const UNSEEN = '#00000000';

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
 * **The label is unseen text in the badge's end padding.** `@expo/ui`'s
 * Compose layer exposes no modifier that sets a content description (only
 * `Icon` takes one as a prop, and `semantics` takes `contentType` and nothing
 * else), and TalkBack reads the number the badge draws. So what the label
 * says past that number ("new" of "3 new", the whole label of a dot) is a
 * transparent `Text` after the badge, which TalkBack reads after the number:
 * merged into a row that presses or a Material `ListItem`, a stop of its own
 * anywhere else. When a description modifier lands, this is the first place
 * to use it.
 *
 * A `label` of `null`, a badge its parent speaks for, puts no words in at
 * all. The number is still a `Text` Compose reads: only the words after it
 * can be left out here, since `@expo/ui` has no modifier that clears a
 * node's semantics.
 *
 * Where nothing merges them, Compose orders the two by where they are and
 * leaves out of TalkBack's tree a node that a sibling drawn above it covers.
 * So the text is a small box at the badge's end edge, inside the padding
 * Material keeps beside the number: it covers none of the number and comes
 * after it in either direction. Laid over the whole badge it would hide the
 * number and be read first.
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
  const words = props.label === null ? '' : badgeWordsAfter(badgeLabel(props, text), text);
  return (
    <Box contentAlignment="center">
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
      {/* As wide as the badge's end padding and as high as a dot, so it never
          reaches the number or past the badge, and neither widens nor moves
          it, yet is not so small that TalkBack passes over it as off screen.
          A transparent color rather than a zero alpha, which Compose would
          take for an invisible layer and leave out. */}
      {words ? (
        <Text color={UNSEEN} maxLines={1} modifiers={[align('centerEnd'), size(MATERIAL_BADGE.padding, MATERIAL_BADGE.dot)]}>
          {words}
        </Text>
      ) : null}
    </Box>
  );
}
