import type {LayoutChangeEvent} from 'react-native';
import type {ScreenProps} from './index';
import {useContext, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {NativeHostContext} from '../host/context';
import {useStackHeader} from '../stack-header/context';
import {useColorScheme} from '../scheme';
import {AppToastInsetContext, ToastInsetContext} from '../toast/context';
import * as theme from '../theme';
import {ScreenBarsContext, useScreenBars} from './bars';
import {useToastLift} from './lift';

/**
 * Windows: a desktop window has no safe areas, no status bar to color and no
 * `@expo/ui` host to mount — the kit's controls are XAML islands that sit in
 * a React Native layout directly. `native` therefore only marks the tree as
 * hosted, so components that would mount a host of their own elsewhere
 * render bare here. The screen paints the scheme's background and keeps the
 * content width every platform shares, and draws the bars a control in its
 * content gives it (`ScreenBar`) at its top and its bottom, the floating
 * action button above the bottom ones.
 */
export function Screen({children, native = false, header, gutter = false, fab}: ScreenProps) {
  const stackHeader = useStackHeader();
  const underHeader = header ?? stackHeader;
  const scheme = useColorScheme();
  const backgroundColor = theme.colors[scheme].background;
  // The fab lifts above a toast of the screen's own, and above the app's.
  const lift = useToastLift(useContext(AppToastInsetContext));
  const {bars, top, bottom, hasTop, hasBottom} = useScreenBars();
  const [barHeight, setBarHeight] = useState(0);
  const onBarsLayout = (event: LayoutChangeEvent) => setBarHeight(event.nativeEvent.layout.height);

  return (
    <View style={[styles.screen, {backgroundColor}]}>
      <View style={[styles.root, {paddingTop: underHeader ? 0 : theme.inset.topBar}]}>
        {hasTop ? <View testID="screen-top-rows" style={styles.topRows}>{top}</View> : null}
        <View style={[styles.content, gutter ? styles.gutter : undefined]}>
          <ToastInsetContext.Provider value={lift.report}>
            <ScreenBarsContext.Provider value={bars}>
              {native ? (
                <NativeHostContext.Provider value={true}>
                  <View style={styles.host}>{children}</View>
                </NativeHostContext.Provider>
              ) : children}
            </ScreenBarsContext.Provider>
          </ToastInsetContext.Provider>
        </View>
      </View>
      {hasBottom ? <View onLayout={onBarsLayout} testID="screen-bars">{bottom}</View> : null}
      {fab != null ? (
        <Animated.View testID="screen-fab" style={[styles.fab, {bottom: theme.spacing.three + (hasBottom ? barHeight : 0)}, lift.style]}>
          {fab}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  root: {
    flex: 1,
    alignItems: 'center',
  },
  // The rows at the top: the screen's width above the content, at their own height.
  topRows: {
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: theme.bound.contentMaxWidth,
  },
  host: {
    flex: 1,
  },
  gutter: {
    paddingHorizontal: theme.spacing.three,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.three,
    // Only the button takes presses, not the slot it sits in.
    pointerEvents: 'box-none',
  },
});

export type {ScreenProps} from './index';
