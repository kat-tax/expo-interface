import type {LayoutChangeEvent} from 'react-native';
import type {TabBarProps, TabRoute, WindowsPane} from './types';
import {useState} from 'react';
import {Navigator, TabRouter} from 'expo-router';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import XamlNavigationView from '../windows/specs/ExpoInterfaceNavigationViewNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {windowsGlyph} from '../symbol/segoe';
import {useColor} from '../theme';

/** The pane a tab bar resolves to: the row along the top, or the side pane, expanded or compact. */
export type ResolvedPane = 'top' | 'left' | 'compact';

/** WinUI's pane widths — `OpenPaneLength` and `CompactPaneLength` — which the island is sized to beside the content. */
export const PANE_WIDTH = {open: 320, compact: 48} as const;

/** WinUI's adaptive `NavigationView` breakpoints: the expanded pane from 1008 points of width, the compact one from 641. */
export const PANE_BREAKPOINT = {expanded: 1008, compact: 641} as const;

/**
 * The pane a request resolves to at a width. `auto` decides as WinUI's
 * adaptive `NavigationView` does, except below the compact breakpoint,
 * where WinUI shows a minimal pane that overlays the content: an island
 * cannot draw over what is beside it, so the top bar goes there.
 */
export function resolvePane(pane: WindowsPane, width: number): ResolvedPane {
  if (pane !== 'auto') return pane;
  if (width >= PANE_BREAKPOINT.expanded) return 'left';
  if (width >= PANE_BREAKPOINT.compact) return 'compact';
  return 'top';
}

/**
 * Windows: a WinUI 3 `NavigationView` — the platform's tab bar, a row of
 * items along the top of the window, or with `windowsPane` the navigation
 * pane down the left side, expanded or compact, with its toggle button —
 * beside the focused tab's screens. The routes are Expo Router's, driven by
 * a custom navigator on the tab router (no native tabs, which
 * react-native-screens does not draw on Windows), so `Link`, `useRouter`
 * and the rest work as they do anywhere. `hidden` drops the bar and leaves
 * the screens.
 *
 * The pane's toggle button collapses it to its glyphs and opens it again:
 * WinUI flips the pane, and the kit answers with the island's width and
 * the matching mode, expanded or compact.
 */
export function Tabs({routes, hidden = false, windowsPane = 'top'}: TabBarProps) {
  return (
    <Navigator router={TabRouter} initialRouteName={routes[0]?.name}>
      <TabsBody routes={routes} hidden={hidden} pane={windowsPane}/>
    </Navigator>
  );
}

/** The bar's items as the island's JSON: the label and the Fluent glyph of each tab. */
export function tabItems(routes: readonly TabRoute[]): string {
  return jsonProp(routes.map(route => ({
    label: route.label,
    glyph: windowsGlyph({symbol: route.icon}) ?? null,
  })));
}

/** What the pane last reported, and the pane it was in. */
interface Toggle {
  pane: ResolvedPane;
  open: boolean;
}

function TabsBody({routes, hidden, pane}: {routes: readonly TabRoute[]; hidden: boolean; pane: WindowsPane}) {
  const {state, navigation} = Navigator.useContext();
  const xaml = useXamlProps();
  const background = useColor('background');
  // The width the tabs are given: the window's until the first layout, then
  // their own — react-native-windows reports no dimension change when the
  // window is resized, but the layout follows it.
  const {width: windowWidth} = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const resolved = resolvePane(pane, measured ?? windowWidth);
  const side = resolved !== 'top';
  // The pane's own open state holds while the pane it was made in stays resolved.
  const [toggle, setToggle] = useState<Toggle | null>(null);
  const open = toggle?.pane === resolved ? toggle.open : resolved === 'left';
  const current = state.routes[state.index]?.name;
  const selectedIndex = Math.max(0, routes.findIndex(route => route.name === current));
  const onLayout = (event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width);
  return (
    <View style={[styles.root, side && styles.row]} onLayout={onLayout} testID="tabs">
      {!hidden ? (
        <XamlNavigationView
          items={tabItems(routes)}
          selectedIndex={selectedIndex}
          paneMode={side ? (open ? 'left' : 'compact') : 'top'}
          background={background}
          onSelectionChange={event => {
            const route = routes[event.nativeEvent.index];
            if (route && route.name !== current) navigation.navigate(route.name);
          }}
          onPaneOpenChange={event => setToggle({pane: resolved, open: event.nativeEvent.open})}
          style={side ? [styles.pane, {width: open ? PANE_WIDTH.open : PANE_WIDTH.compact}] : styles.bar}
          testID="tab-bar"
          {...xaml}
        />
      ) : null}
      <View style={styles.slot}>
        <Navigator.Slot/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  bar: {
    alignSelf: 'stretch',
  },
  pane: {
    alignSelf: 'stretch',
  },
  slot: {
    flex: 1,
  },
});
