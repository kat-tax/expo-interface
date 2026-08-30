import type {ColorSchemeName, ColorValue} from 'react-native';
import type {Edge} from 'react-native-safe-area-context';

import {Host} from '@expo/ui';
import {useEffect} from 'react';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useColorScheme, Appearance, StyleSheet, View} from 'react-native';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {useAccentSeed} from '../accent';
import * as theme from '../theme';

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
  /** Whether to apply a horizontal padding to the screen. */
  gutter?: boolean;
}

export function Screen({
  children,
  native = false,
  header = false,
  gutter = false,
}: ScreenProps) {
  const seed = useAccentSeed();
  const scheme = useColorScheme();
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
        <View style={[styles.content, gutter ? styles.gutter : undefined]}>
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
    gap: theme.spacing.three,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: theme.bound.contentMaxWidth,
  },
  gutter: {
    paddingHorizontal: theme.spacing.three,
  },
});
