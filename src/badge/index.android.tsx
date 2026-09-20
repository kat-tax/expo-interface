import type {BadgeProps} from './types';
import {Badge as ComposeBadge, Text} from '@expo/ui/jetpack-compose';
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {onAccent} from '../accent';
import {useColor} from '../theme';
import {BADGE_FONT_SIZE, badgeText} from './shared';

/**
 * Android hosts the Material 3 Compose `Badge` — the real control, so it takes
 * the platform's own shape, its minimum size, and the way it grows from a dot
 * into a capsule as the number does.
 *
 * **TalkBack reads the number alone here**, not the `label`. `@expo/ui`'s
 * Compose layer exposes no modifier that sets a content description — only
 * `Icon` takes one as a prop, and `semantics` takes `contentType` and nothing
 * else — so there is nowhere to put a better name. The other three platforms
 * announce the label. This is one concrete instance of the thin Android
 * semantics noted in the roadmap's accessibility section; when a modifier for
 * it lands, this is the first place to use it.
 */
export function Badge(props: BadgeProps) {
  const text = badgeText(props);
  const destructive = useColor('destructive');
  if (text === null) return null;
  const {dot, color, textColor, testID} = props;
  const fill = color ?? destructive;
  const content = textColor ?? onAccent(fill);
  return (
    <ComposeBadge
      containerColor={fill}
      contentColor={content}
      modifiers={testID ? [testIDModifier(testID)] : []}>
      {/* A dot is a badge with nothing in it, which is how Compose draws one. */}
      {dot ? null : <Text color={content} style={{fontSize: BADGE_FONT_SIZE}}>{text}</Text>}
    </ComposeBadge>
  );
}
