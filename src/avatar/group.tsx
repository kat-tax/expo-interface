import type {AvatarGroupPerson, AvatarGroupProps} from './types';
import {useId} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {pressFeedback} from '../surface/shared';
import {isColorToken, useColor} from '../theme';
import {AvatarFace} from './drawn';
import {AVATAR_RING} from './shared';

/**
 * react-native-web drops `accessibilityHint`, and a `<button>` cannot be
 * `aria-selected`: on web a face's hint is the description it takes from a
 * hidden element beside it, and the selected face is the current one.
 */
const WEB = Platform.OS === 'web';

/**
 * The circle inside a face's button: the button is the accessibility
 * element, so the circle gets no name and no stop of its own. The name goes
 * as well as the stop because react-native-web drops `accessible`.
 */
const SILENT = {accessible: false, accessibilityLabel: undefined};

/**
 * A face that does not press is a picture. On web it says so: a name and a
 * state on an element with no role are not read. iOS, Android and Windows
 * read the circle as it is.
 */
const PICTURE = WEB ? {role: 'img' as const} : null;

/**
 * What a face says: the person's label (their name unless told otherwise),
 * the hint read after it, and whether they are the selected one. Only a
 * selected face says so: on Windows any `selected` value, `false` included,
 * makes the element selectable.
 */
function announcement({name, label, hint, selected}: AvatarGroupPerson, hintId: string) {
  const state = WEB
    ? {'aria-current': selected ? true : undefined, 'aria-describedby': hint != null ? hintId : undefined}
    : {'aria-selected': selected ? true : undefined};
  return {accessibilityLabel: label ?? name, accessibilityHint: hint, ...state};
}

/**
 * People as overlapping faces, a facepile (see {@link AvatarGroupProps}).
 * Each face overlaps the one before it by a quarter of its size, parted
 * from it by a ring in the fill behind the group; past `max` the rest are
 * counted in a `+N` face. A face presses and presses and holds when the
 * group is told what to do with either. A person's `label` and `hint` name
 * and describe their face, `selected` announces it, and `disabled` takes it
 * out of both presses and dims it.
 *
 * Drawn in React Native on every platform, Windows included, where `Avatar`
 * is WinUI's `PersonPicture`: an island takes the pointer, and a facepile's
 * faces are pressed.
 */
export function AvatarGroup({people, max = 3, size = 24, ring = 'background', onPress, onLongPress, onPressMore, testID}: AvatarGroupProps) {
  const ident = useId();
  const shown = people.slice(0, max);
  const more = people.length - shown.length;
  const overlap = Math.round(size / 4);
  const pressable = onPress != null || onLongPress != null;
  return (
    <View style={styles.row} testID={testID}>
      {shown.map((person, index) => {
        const hintId = `${ident}-hint-${index}`;
        const announced = announcement(person, hintId);
        // TODO(windows): a PersonPicture island per face, as `Avatar` draws
        // one, once the island can take the press itself (a XAML Button
        // around the picture, reporting a press and a press and hold): an
        // island takes the pointer before a Pressable around it does. That
        // button carries the person's label, hint, selected and disabled.
        const face = (
          <AvatarFace
            name={person.name}
            initials={person.initials}
            color={person.color}
            ring={person.ring ?? ring}
            dimmed={person.dimmed || person.disabled}
            size={size}
            {...(pressable ? SILENT : {...announced, ...PICTURE})}
          />
        );
        return (
          <View key={person.key ?? `${person.name}-${index}`} style={index > 0 ? {marginLeft: -overlap} : null}>
            {pressable ? (
              <Pressable
                role="button"
                {...announced}
                disabled={person.disabled}
                onPress={() => onPress?.(person, index)}
                onLongPress={() => onLongPress?.(person, index)}
                style={state => pressFeedback(state, 'accent')}>
                {face}
              </Pressable>
            ) : face}
            {WEB && person.hint != null ? <Text id={hintId} style={styles.hidden}>{person.hint}</Text> : null}
          </View>
        );
      })}
      {more > 0 ? <More count={more} size={size} ring={ring} overlap={shown.length > 0 ? overlap : 0} onPress={onPressMore}/> : null}
    </View>
  );
}

/** The face that counts the rest: `+N` on the raised fill, pressable when the group says what it does. */
function More({count, size, ring, overlap, onPress}: {count: number; size: number; ring: string; overlap: number; onPress?: () => void}) {
  const fill = useColor('backgroundElement');
  const label = useColor('secondaryLabel');
  const token = useColor(isColorToken(ring) ? ring : 'background');
  const face = (
    <View
      {...(onPress ? SILENT : {accessible: true, accessibilityLabel: `${count} more`, ...PICTURE})}
      style={[styles.face, {width: size, height: size, borderRadius: size / 2, backgroundColor: fill, borderWidth: AVATAR_RING, borderColor: isColorToken(ring) ? token : ring}]}>
      <Text numberOfLines={1} style={[styles.count, {color: label, fontSize: Math.round(size * 0.4)}]}>{`+${count}`}</Text>
    </View>
  );
  return (
    <View style={{marginLeft: -overlap}}>
      {onPress ? (
        <Pressable role="button" accessibilityLabel={`${count} more`} onPress={onPress} style={state => pressFeedback(state, 'accent')}>
          {face}
        </Pressable>
      ) : face}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontWeight: '600',
  },
  hidden: {
    display: 'none',
  },
});
