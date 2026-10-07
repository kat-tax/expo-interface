import type {AvatarGroupProps} from './types';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {pressFeedback} from '../surface/shared';
import {isColorToken, useColor} from '../theme';
import {DrawnAvatar} from './drawn';
import {AVATAR_RING} from './shared';

/**
 * People as overlapping faces, a facepile (see {@link AvatarGroupProps}).
 * Each face overlaps the one before it by a quarter of its size, parted
 * from it by a ring in the fill behind the group; past `max` the rest are
 * counted in a `+N` face. A face presses and presses and holds when the
 * group is told what to do with either.
 *
 * Drawn in React Native on every platform, Windows included, where `Avatar`
 * is WinUI's `PersonPicture`: an island takes the pointer, and a facepile's
 * faces are pressed.
 */
export function AvatarGroup({people, max = 3, size = 24, ring = 'background', onPress, onLongPress, onPressMore, testID}: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const more = people.length - shown.length;
  const overlap = Math.round(size / 4);
  const pressable = onPress != null || onLongPress != null;
  return (
    <View style={styles.row} testID={testID}>
      {shown.map((person, index) => {
        // TODO(windows): a PersonPicture island per face, as `Avatar` draws
        // one, once the island can take the press itself (a XAML Button
        // around the picture, reporting a press and a press and hold): an
        // island takes the pointer before a Pressable around it does.
        const face = <DrawnAvatar {...person} size={size} ring={person.ring ?? ring}/>;
        return (
          <View key={person.key ?? `${person.name}-${index}`} style={index > 0 ? {marginLeft: -overlap} : null}>
            {pressable ? (
              <Pressable
                role="button"
                accessibilityLabel={person.name}
                onPress={() => onPress?.(person, index)}
                onLongPress={() => onLongPress?.(person, index)}
                style={state => pressFeedback(state, 'accent')}>
                {face}
              </Pressable>
            ) : face}
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
      accessible={onPress == null}
      accessibilityLabel={`${count} more`}
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
});
