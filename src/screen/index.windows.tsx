import type {ScreenProps} from './index';
import {StyleSheet, View} from 'react-native';
import {NativeHostContext} from '../host/context';
import {useStackHeader} from '../stack-header/context';
import {useColorScheme} from '../scheme';
import * as theme from '../theme';

/**
 * Windows: a desktop window has no safe areas, no status bar to color and no
 * `@expo/ui` host to mount — the kit's controls are XAML islands that sit in
 * a React Native layout directly. `native` therefore only marks the tree as
 * hosted, so components that would mount a host of their own elsewhere
 * render bare here. The screen paints the scheme's background and keeps the
 * content width every platform shares.
 */
export function Screen({children, native = false, header, gutter = false, fab}: ScreenProps) {
  const stackHeader = useStackHeader();
  const underHeader = header ?? stackHeader;
  const scheme = useColorScheme();
  const backgroundColor = theme.colors[scheme].background;

  return (
    <View style={[styles.screen, {backgroundColor}]}>
      <View style={[styles.root, {paddingTop: underHeader ? 0 : theme.inset.topBar}]}>
        <View style={[styles.content, gutter ? styles.gutter : undefined]}>
          {native ? (
            <NativeHostContext.Provider value={true}>
              <View style={styles.host}>{children}</View>
            </NativeHostContext.Provider>
          ) : children}
        </View>
      </View>
      {fab != null ? (
        <View testID="screen-fab" style={styles.fab}>
          {fab}
        </View>
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
    gap: theme.spacing.three,
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
    bottom: theme.spacing.three,
    // Only the button takes presses, not the slot it sits in.
    pointerEvents: 'box-none',
  },
});

export type {ScreenProps} from './index';
