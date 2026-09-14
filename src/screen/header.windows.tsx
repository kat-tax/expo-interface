import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Symbol} from '../symbol';
import {icon} from '../icons';
import {pressFeedback} from '../surface/shared';
import {bound, fonts, fontWeights, spacing, useColor} from '../theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}

/** The header's back glyph: Segoe's `Back` arrow, as WinUI's own headers draw it. */
const BACK = icon({ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back', windows: 'E72B'});

/**
 * Windows: the same row as everywhere, 48 points tall like a WinUI title
 * row, with the back arrow in Segoe Fluent Icons. A desktop window has no
 * status bar to leave room for.
 */
export function ScreenHeader({title, onBack, trailing}: ScreenHeaderProps) {
  const label = useColor('label');
  const background = useColor('background');

  return (
    <View style={[styles.bar, {backgroundColor: background}]}>
      <View style={styles.inner}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            role="button"
            accessibilityLabel="Go back"
            style={state => [styles.back, pressFeedback(state)]}>
            <Symbol icon={BACK} size={16} tintColor={label}/>
          </Pressable>
        ) : null}
        <Text numberOfLines={1} style={[styles.title, {color: label}]}>
          {title}
        </Text>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: bound.contentMaxWidth,
    paddingHorizontal: spacing.three,
    height: 48,
    gap: spacing.two,
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.one,
  },
  title: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
  },
});
