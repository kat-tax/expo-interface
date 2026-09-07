import type {ColorSchemeName, ColorValue} from 'react-native';
import type {Edge} from 'react-native-safe-area-context';
import type {PropsWithChildren, ReactNode} from 'react';

import {Host} from '@expo/ui';
import {useEffect} from 'react';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Appearance, Platform, StyleSheet, View} from 'react-native';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {useAccentSeed} from '../accent';
import {useColorScheme} from '../scheme';
import * as theme from '../theme';

import {hostAccentProps} from './host-accent';

const CONTENT_EDGES: Edge[] = ['left', 'right', 'bottom'];
const BG_COLOR: Record<ColorSchemeName, ColorValue> = {
  unspecified: theme.colors.light.background,
  light: theme.colors.light.background,
  dark: theme.colors.dark.background,
};

/**
 * Web paints the palette's CSS variable: it follows the media query and a
 * forced `data-theme` before any JavaScript runs, so the static export is not
 * white behind dark controls until the first re-render. Native paints the
 * scheme's literal color, which the system UI (`expo-system-ui`) also takes.
 */
const background = (scheme: ColorSchemeName): ColorValue =>
  Platform.OS === 'web' ? theme.theme.background : BG_COLOR[scheme];

setBackgroundColorAsync(background(Appearance.getColorScheme() ?? 'unspecified'));

export interface ScreenProps extends PropsWithChildren {
  /** Whether to expect an @expo/ui or normal RN component children. */
  native?: boolean;
  /** Screen sits below a stack header — skip redundant top inset/padding. */
  header?: boolean;
  /** Whether to apply a horizontal padding to the screen. */
  gutter?: boolean;
  /**
   * A floating action button (`Fab`) the screen places itself: bottom
   * trailing, `spacing.three` from the edges plus the safe-area bottom inset
   * natively (which includes the tab bar when the screen shows one), fixed
   * to the viewport on web.
   */
  fab?: ReactNode;
}

export function Screen({
  children,
  native = false,
  header = false,
  gutter = false,
  fab,
}: ScreenProps) {
  const seed = useAccentSeed();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const backgroundColor = background(scheme);

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
      {fab != null ? (
        <View
          testID="screen-fab"
          pointerEvents="box-none"
          style={[
            styles.fab,
            Platform.OS === 'web'
              ? styles.fabFixed
              : {right: theme.spacing.three + insets.right, bottom: theme.spacing.three + insets.bottom},
          ]}>
          {fab}
        </View>
      ) : null}
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
  fab: {
    position: 'absolute',
    right: theme.spacing.three,
    bottom: theme.spacing.three,
  },
  // react-native-web passes `fixed` through to the CSS; React Native's types do not know it.
  fabFixed: {
    position: 'fixed' as 'absolute',
    right: theme.spacing.three,
    bottom: theme.spacing.three,
  },
});
