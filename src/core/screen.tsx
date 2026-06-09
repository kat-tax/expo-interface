import type {ColorSchemeName, ColorValue} from 'react-native';
import type {Edge} from 'react-native-safe-area-context';

import {Host} from '@expo/ui';
import {StatusBar} from 'expo-status-bar';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {useColorScheme, Appearance, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEffect} from 'react';
import * as theme from '@/ui/theme';
import {useAccentSeed} from '@/ui/accent';
import {hostAccentProps} from './host-accent';

const CONTENT_EDGES: Edge[] = ['left', 'right', 'bottom'];
const BG_COLOR: Record<ColorSchemeName, ColorValue> = {
  unspecified: theme.colors.light.background,
  light: theme.colors.light.background,
  dark: theme.colors.dark.background,
};

setBackgroundColorAsync(BG_COLOR[Appearance.getColorScheme() ?? 'unspecified']);

interface ScreenProps extends React.PropsWithChildren {
  /** Whether to expect an @expo/ui or normal RN component children. */
  native?: boolean;
  /** Screen sits below a stack header — skip redundant top inset/padding. */
  header?: boolean;
}

export function Screen({children, native = false, header = false}: ScreenProps) {
  const scheme = useColorScheme();
  const seed = useAccentSeed();
  const backgroundColor = BG_COLOR[scheme ?? 'unspecified'];

  useEffect(() => {
    setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor}}
      edges={header ? CONTENT_EDGES : undefined}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'}/>
      <View style={[styles.root, {paddingTop: header ? 0 : theme.inset.topBar}]}>
        <View style={styles.content}>
          {!native ? children : (
            <Host style={{flex: 1}} {...hostAccentProps(seed)}>
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
    paddingBottom: theme.inset.bottomTab + theme.spacing.three,
    gap: theme.spacing.three,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: theme.bound.contentMaxWidth,
  },
});
