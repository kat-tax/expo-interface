import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SymbolView} from 'expo-symbols';
import {bound, spacing, useColor} from '@/ui/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

export function ScreenHeader({title, onBack}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const label = useColor('label');
  const background = useColor('background');
  const paddingTop = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.bar, {backgroundColor: background, paddingTop}]}>
      <View style={styles.inner}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityLabel="Go back"
            style={styles.back}>
            <SymbolView
              name={{web: 'arrow_back', ios: 'chevron.left', android: 'arrow_back'}}
              size={24}
              tintColor={label}
            />
          </Pressable>
        ) : null}
        <Text numberOfLines={1} style={[styles.title, {color: label}]}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.four,
  },
  inner: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: bound.contentMaxWidth,
    height: 64,
    gap: spacing.two,
  },
  back: {
    padding: spacing.one,
    marginLeft: -spacing.one,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
});
