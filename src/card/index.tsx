import type {CardProps} from './types';
import {useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {IconToggle} from '../icon-toggle';
import {Menu} from '../menu';
import {Surface} from '../surface';
import {Caption, Headline} from '../typography';
import {useReveal} from './reveal';
import {MENU_ROOM, MORE, STAR, STAR_FILLED, cardName} from './shared';

/**
 * Android draws the star in Material's tonal container: a phone has no
 * pointer to reveal it with, so it is always on the picture, where a bare
 * icon has nothing behind it. The other platforms keep the bare star.
 */
const material = Platform.OS === 'android';

/**
 * A pressable surface with a picture, a title, a menu and a star, and the
 * two floating slots they sit in (see {@link CardProps}).
 */
export function Card({
  children,
  media,
  header,
  title,
  subtitle,
  footer,
  menu,
  favorite,
  overlay,
  badge,
  onPress,
  onLongPress,
  label,
  padding = 12,
  gap = 8,
  disabled = false,
  style,
  testID,
}: CardProps) {
  const reveal = useReveal();
  const [footerHeight, setFooterHeight] = useState(0);

  // The kit's controls take the two floating slots; the app's own are
  // placed there otherwise.
  const trailing = menu ? (
    <Menu
      label="More"
      icon={MORE}
      hideLabel
      variant="text"
      size="small"
      items={menu}
      testID={testID ? `${testID}-menu` : undefined}
    />
  ) : overlay;
  const corner = favorite ? (
    <IconToggle
      label={favorite.label ?? 'Favorite'}
      icon={STAR}
      activeIcon={STAR_FILLED}
      value={favorite.value}
      onValueChange={favorite.onValueChange}
      variant={material ? 'tonal' : 'plain'}
      offVisibility={reveal.revealed ? 'visible' : 'hidden'}
      testID={testID ? `${testID}-favorite` : undefined}
    />
  ) : badge;

  // The footer the kit draws from a title, or the app's own. With something
  // level with it at the trailing edge, its height is measured so that
  // something can be centred on it.
  const foot = title !== undefined ? (
    <View style={[styles.titles, trailing ? styles.titlesBesideMenu : null]}>
      <Headline color="label" numberOfLines={1}>{title}</Headline>
      {subtitle !== undefined ? <Caption color="secondaryLabel" numberOfLines={1}>{subtitle}</Caption> : null}
    </View>
  ) : footer;
  const content = (
    <>
      {header}
      {children}
      {foot && trailing ? (
        <View onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}>{foot}</View>
      ) : foot}
    </>
  );

  const card = (
    <Surface
      border="all"
      padding={media ? 0 : padding}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      label={cardName(label, title, subtitle)}
      style={[media ? styles.clipped : {gap}, style]}
      testID={testID}>
      {media ? (
        <>
          <View style={styles.media}>{media}</View>
          <View style={{padding, gap}}>{content}</View>
        </>
      ) : content}
    </Surface>
  );

  if (!trailing && !corner) return card;

  // Both slots are siblings of the card rather than children of it: what they
  // hold is a button, and a button cannot be nested in the card's own.
  return (
    <View style={styles.stack} {...reveal.props}>
      {card}
      {corner ? (
        <View
          testID={testID ? `${testID}-badge` : undefined}
          style={[styles.float, styles.badge, {padding}]}>
          {corner}
        </View>
      ) : null}
      {trailing ? (
        <View
          testID={testID ? `${testID}-overlay` : undefined}
          style={[
            styles.float,
            styles.overlay,
            {padding},
            footerHeight > 0 ? {height: footerHeight + padding * 2, justifyContent: 'center'} : null,
          ]}>
          {trailing}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'relative',
  },
  // A picture bleeding to the edges is clipped by the corners.
  clipped: {
    overflow: 'hidden',
  },
  media: {
    alignSelf: 'stretch',
  },
  titles: {
    alignSelf: 'stretch',
  },
  titlesBesideMenu: {
    paddingRight: MENU_ROOM,
  },
  // What the two floating slots share: the card's trailing edge, taking no
  // presses of their own so the card behind keeps the rest of its face.
  float: {
    position: 'absolute',
    right: 0,
    pointerEvents: 'box-none',
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlay: {bottom: 0},
  badge: {top: 0},
});

export type {CardFavorite, CardProps} from './types';
