import type {ColorSchemeName, ColorValue} from 'react-native';

import {Host} from '@expo/ui';
import {StatusBar} from 'expo-status-bar';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {useColorScheme, Appearance, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEffect} from 'react';
import * as theme from '@/ui/theme';

const BG_COLOR: Record<ColorSchemeName, ColorValue> = {
  unspecified: theme.colors.light.background,
  light: theme.colors.light.background,
  dark: theme.colors.dark.background,
};

setBackgroundColorAsync(BG_COLOR[Appearance.getColorScheme() ?? 'unspecified']);

interface ScreenProps extends React.PropsWithChildren {
  native?: boolean;
}

export function Screen({children, native = false}: ScreenProps) {
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
    paddingHorizontal: theme.spacing.four,
    paddingBottom: theme.inset.bottomTab + theme.spacing.three,
    paddingTop: theme.inset.topBar,
    gap: theme.spacing.three,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: theme.bound.contentMaxWidth,
  },
});
