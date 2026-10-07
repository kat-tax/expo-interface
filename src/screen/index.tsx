import type {ColorSchemeName, ColorValue, LayoutChangeEvent} from 'react-native';
import type {Edge} from 'react-native-safe-area-context';
import type {PropsWithChildren, ReactNode} from 'react';

import {Host} from '@expo/ui';
import {useContext, useEffect, useMemo, useState} from 'react';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Animated, Appearance, Platform, StyleSheet, View} from 'react-native';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {useAccentSeed} from '../accent';
import {NativeHostContext} from '../host';
import {useFloatingHeader, useStackHeader} from '../stack-header/context';
import {useColorScheme} from '../scheme';
import {FoldedSearchContext, useNativeTabs, useTabBarInset} from '../tabs/context';
import {ToastInsetContext} from '../toast/context';
import * as theme from '../theme';

import {ScreenBarsContext, useScreenBars} from './bars';
import {hostAccentProps} from './host-accent';
import {ScrollInsetsContext} from './insets';
import {useToastLift} from './lift';

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
  /**
   * Whether the screen sits below a stack header, and so skips the top inset
   * it would otherwise leave for the status bar. Inferred from the navigator
   * above it — a `TabStack` shows a header on every platform — so it only
   * needs setting under a plain `Stack` with its header hidden.
   */
  header?: boolean;
  /** Whether to apply a horizontal padding to the screen. */
  gutter?: boolean;
  /**
   * The content starts under the bar floating over the screen's top rather
   * than below it, for a scrolling screen whose content should pass under a
   * material bar and show through it: the web tab bar (`Tabs webMaterial`),
   * or on iOS the stack header of a `TabStack` with a `material`. A kit
   * `List` or `CardGrid` in the content pads its own content and its
   * scroll indicators by the bar's inset (`useScrollInsets()`), so its first
   * row starts clear of the bar; a scroll view of the app's own pads its
   * content by `useTabBarInset()`. Under an opaque header (Android's always
   * is) the top inset is already nothing, so this changes nothing.
   * @default false
   */
  underBar?: boolean;
  /**
   * A floating action button (`Fab`) the screen places itself: bottom
   * trailing, `spacing.three` from the edges plus the safe-area bottom inset
   * natively (which includes the tab bar when the screen shows one), fixed
   * to the viewport on web. While a `Toast` under the screen shows, the
   * button lifts above it and comes back down as it goes, and it sits above
   * a bar the screen draws at its bottom.
   */
  fab?: ReactNode;
}

/**
 * The root of a route. A control in its content can give it a bar of the
 * screen's own (`ScreenBar`): a `HeaderSearch` that mirrors a header the
 * platform does not have puts its row at the top, above the content, or its
 * bottom bar below it, where the `Fab` lifts above it.
 */
export function Screen({
  children,
  native = false,
  header,
  gutter = false,
  underBar = false,
  fab,
}: ScreenProps) {
  const seed = useAccentSeed();
  const stackHeader = useStackHeader();
  const underHeader = header ?? stackHeader;
  const floating = useFloatingHeader();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const backgroundColor = background(scheme);
  const lift = useToastLift();
  const {bars, top, bottom, hasBottom} = useScreenBars();
  // What the content under a bar pads itself by, handed to the kit's scrolling components.
  const barInset = useTabBarInset();
  const scrollInsets = useMemo(() => ({top: underBar ? barInset : 0, bottom: 0}), [underBar, barInset]);
  // The bottom bars' height, measured, which the fab sits above.
  const [barHeight, setBarHeight] = useState(0);
  const onBarsLayout = (event: LayoutChangeEvent) => setBarHeight(event.nativeEvent.layout.height);
  // Android's tab host keeps its screens above the navigation bar itself: a
  // safe-area view in one measures from the host, not the window, and would
  // pay the inset a second time, so the bottom is the host's there.
  const underTabs = useNativeTabs();
  const bottomPaid = Platform.OS === 'android' && underTabs;
  const edges: Edge[] = [...(underHeader ? [] : ['top' as const]), 'left', 'right', ...(bottomPaid ? [] : ['bottom' as const])];
  // On web a folded header's search row under the tab bar is one more thing above the content.
  const foldedSearch = useContext(FoldedSearchContext);
  // The top: the status bar's own, with no header above (web pads the bar's
  // height, and the top edge pays the status bar natively); under a header
  // the content runs under, the header's height stays clear, unless the
  // content passes under it and pads itself (`underBar`).
  const paddingTop = underBar ? 0 : !underHeader ? theme.inset.topBar + foldedSearch : floating ? insets.top + theme.inset.header : 0;
  const fabBottom = theme.spacing.three + (hasBottom ? barHeight : 0);

  useEffect(() => {
    setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor}}
      edges={edges}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'}/>
      <View style={[styles.root, {paddingTop}]}>
        {top}
        <View style={[styles.content, gutter ? styles.gutter : undefined]}>
          <ToastInsetContext.Provider value={lift.report}>
            <ScreenBarsContext.Provider value={bars}>
              <ScrollInsetsContext.Provider value={scrollInsets}>
                {!native ? children : (
                  <NativeHostContext.Provider value={true}>
                    <Host style={{flex: 1}} {...hostAccentProps(seed)}>
                      {children}
                    </Host>
                  </NativeHostContext.Provider>
                )}
              </ScrollInsetsContext.Provider>
            </ScreenBarsContext.Provider>
          </ToastInsetContext.Provider>
        </View>
      </View>
      {hasBottom ? <View onLayout={onBarsLayout} testID="screen-bars">{bottom}</View> : null}
      {fab != null ? (
        <Animated.View
          testID="screen-fab"
          style={[
            styles.fab,
            Platform.OS === 'web'
              ? [styles.fabFixed, {bottom: fabBottom}]
              : {right: theme.spacing.three + insets.right, bottom: fabBottom + (bottomPaid ? 0 : insets.bottom)},
            lift.style,
          ]}>
          {fab}
        </Animated.View>
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
    // Only the button takes presses, not the slot it sits in.
    pointerEvents: 'box-none',
  },
  // react-native-web passes `fixed` through to the CSS; React Native's types do not know it.
  fabFixed: {
    position: 'fixed' as 'absolute',
    right: theme.spacing.three,
  },
});
