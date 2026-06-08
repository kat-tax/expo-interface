import type {ColorSchemeName, ColorValue} from 'react-native';

import {useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useColorScheme, Appearance, StyleSheet, View} from 'react-native';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {StatusBar} from 'expo-status-bar';
import {Host} from '@expo/ui';

import {bound, colors, inset, spacing} from '@/ui/theme';

const BG_COLOR: Record<ColorSchemeName, ColorValue> = {
  unspecified: colors.light.background,
  light: colors.light.background,
  dark: colors.dark.background,
};

setBackgroundColorAsync(BG_COLOR[Appearance.getColorScheme() ?? 'unspecified']);

export function Screen({children, native = false}: React.PropsWithChildren & {native?: boolean}) {
  const scheme = useColorScheme();
  const backgroundColor = BG_COLOR[scheme ?? 'unspecified'];

  useEffect(() => {
    setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor}}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'}/>
      <View style={styles.root}>
        <View style={styles.content}>
          {!native ? children : (
            <Host style={{flex: 1}}>
              {children}
            </Host>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.four,
    paddingBottom: inset.bottomTab + spacing.three,
    paddingTop: inset.topBar,
    gap: spacing.three,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: bound.contentMaxWidth,
  },
});
