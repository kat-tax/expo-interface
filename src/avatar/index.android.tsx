import type {AvatarProps} from './types';
import {Box, Text} from '@expo/ui/jetpack-compose';
import {alpha, background, clip, Shapes, size, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers';
import {onAccent} from '../accent';
import {useNativeHost} from '../host';
import {isColorToken, useColor} from '../theme';
import {DrawnAvatar} from './drawn';
import {AVATAR_RING, AVATAR_TEXT_RATIO, colorOf, initialsOf} from './shared';

/** The name's text in a hosted avatar: there for TalkBack, not to be seen. */
const UNSEEN = '#00000000';

/**
 * Inside a native host (a `ListItem`'s `leading`, a `NativeHost`, `Screen
 * native`) Android draws the avatar in Compose: the circle, the initials and
 * the ring. A Compose row composes its slots as Compose content, with no
 * host for a React Native view, so the drawn circle would not show there.
 *
 * Outside one a Compose view has no composition to draw in, so the avatar is
 * drawn in React Native, as it is on iOS and web.
 */
export function Avatar(props: AvatarProps) {
  const hosted = useNativeHost();
  return hosted ? <ComposeAvatar {...props}/> : <DrawnAvatar {...props}/>;
}

/**
 * The circle in Compose, for an avatar inside a host.
 *
 * The ring is a circle behind a smaller one, as the kit draws a swatch's
 * ring: `@expo/ui`'s `border` modifier takes no shape, so it would draw a
 * square. The initials sit in the inner circle, in the color that reads on
 * the fill.
 *
 * **The name is unseen text over the face.** `@expo/ui`'s Compose layer
 * exposes no modifier that sets a content description, and TalkBack reads a
 * `Text` by its text, so the initials alone would be read as two letters.
 * The name is a transparent `Text` the size of the face, after the initials.
 * Where nothing merges them, Compose leaves out of TalkBack's tree a node
 * that a sibling drawn above it covers, so the face is read as the name
 * alone; inside a row that presses or a Material `ListItem`, which merge
 * what they hold, TalkBack reads the initials and then the name among the
 * row's texts. A transparent color rather than a zero alpha, which Compose
 * would take for an invisible layer and leave out.
 */
function ComposeAvatar({name, initials, color, size: diameter = 28, ring, dimmed = false, testID}: AvatarProps) {
  const fill = color ?? colorOf(name);
  const token = useColor(ring != null && isColorToken(ring) ? ring : 'background');
  const ringColor = ring == null ? undefined : isColorToken(ring) ? token : ring;
  const inner = ringColor == null ? diameter : diameter - 2 * AVATAR_RING;
  const letters = (
    <Text color={onAccent(fill)} maxLines={1} style={{fontSize: Math.round(diameter * AVATAR_TEXT_RATIO), fontWeight: '600'}}>
      {initials ?? initialsOf(name)}
    </Text>
  );
  return (
    <Box
      contentAlignment="center"
      modifiers={[
        size(diameter, diameter),
        clip(Shapes.Circle),
        background(ringColor ?? fill),
        ...(dimmed ? [alpha(0.5)] : []),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}>
      {ringColor == null ? letters : (
        <Box contentAlignment="center" modifiers={[size(inner, inner), clip(Shapes.Circle), background(fill)]}>
          {letters}
        </Box>
      )}
      <Text color={UNSEEN} maxLines={1} modifiers={[size(diameter, diameter)]}>{name}</Text>
    </Box>
  );
}

export {AvatarGroup} from './group';
export type {AvatarGroupPerson, AvatarGroupProps, AvatarProps} from './types';
