import type {LayoutChangeEvent} from 'react-native';
import type {Direction, Size, Transition} from '../windows/motion';
import type {TabBarProps, TabRoute, WindowsPane} from './types';
import {useContext, useEffect, useState, useSyncExternalStore} from 'react';
import {Navigator, TabRouter} from 'expo-router';
import {Animated, StyleSheet, View, useWindowDimensions} from 'react-native';
import XamlNavigationView from '../windows/specs/ExpoInterfaceNavigationViewNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {useWindowChromeState} from '../windows/chrome';
import {useArrival} from '../windows/motion';
import {windowsGlyph} from '../symbol/segoe';
import {useColor} from '../theme';
import {BackStoreContext, ShellCardsContext, ShellHostContext, createBackStore} from './shell';

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
 *
 * The control is the window's frame, as a `NavigationView` is: a card the
 * stack above pushes is drawn in the tabs' content with the pane still there,
 * and the pane's own back button — at the top of the pane, or the start of
 * the top bar — pops it, or pops a screen a stack inside a tab pushed. The
 * button is drawn whenever a stack is around the tabs, disabled at the root
 * as a WinUI app's is, and only while something can pop when the tabs are
 * the root. A selection in the pane leaves the drilled-in screens for the
 * tab. Hidden tabs are no frame: a stack draws its own back button then.
 */
export function Tabs({routes, hidden = false, windowsPane = 'top'}: TabBarProps) {
  return (
    <Navigator router={TabRouter} initialRouteName={routes[0]?.name}>
      <TabsBody routes={routes} hidden={hidden} pane={windowsPane}/>
    </Navigator>
  );
}

/**
 * The bar's items as the island's JSON: the label and the Fluent glyph of
 * each tab, its badge when it has one, and its placement when it is not
 * among the items — the pane's foot, or WinUI's own settings item.
 */
export function tabItems(routes: readonly TabRoute[]): string {
  return jsonProp(routes.map(route => ({
    label: route.label,
    glyph: windowsGlyph({symbol: route.icon}) ?? null,
    ...(route.badge ? {badge: route.badge} : {}),
    ...(route.windowsPlacement && route.windowsPlacement !== 'menu' ? {placement: route.windowsPlacement} : {}),
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
  // With the content in the title bar, the top bar's far end is under the caption buttons: it stops short of them.
  const chrome = useWindowChromeState();
  // The width the tabs are given: the window's until the first layout, then
  // their own — react-native-windows reports no dimension change when the
  // window is resized, but the layout follows it.
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  const [measured, setMeasured] = useState<Size | null>(null);
  const resolved = resolvePane(pane, measured?.width ?? windowWidth);
  const side = resolved !== 'top';
  // The pane's own open state holds while the pane it was made in stays resolved.
  const [toggle, setToggle] = useState<Toggle | null>(null);
  const open = toggle?.pane === resolved ? toggle.open : resolved === 'left';
  const current = state.routes[state.index]?.name;
  const selectedIndex = Math.max(0, routes.findIndex(route => route.name === current));
  const onLayout = (event: LayoutChangeEvent) => setMeasured({width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height});
  // The stack above, if the tabs are in one: told that the bar is here while
  // it is drawn, so a push keeps the tabs as the frame and hands the card down.
  const host = useContext(ShellHostContext);
  const shell = useContext(ShellCardsContext);
  useEffect(() => {
    if (!host || hidden) return;
    host(true);
    return () => host(false);
  }, [host, hidden]);
  // The ways back a stack inside a tab has published, if it can pop.
  const [store] = useState(createBackStore);
  const inner = useSyncExternalStore(store.subscribe, store.get, store.get);
  const covered = shell?.card != null;
  const canGoBack = covered || inner !== null;
  // What the content arrives with: on a selection, along the bar in the order
  // of the items in the top mode, WinUI's page refresh in a side pane; back
  // from a card, the reverse of the motion the card leaves with. A card
  // arriving has a motion of its own.
  const room = measured ?? {width: windowWidth, height: windowHeight};
  const slotKey = covered ? 'covered' : `tab:${current}`;
  const [lastSlot, setLastSlot] = useState({key: slotKey, index: selectedIndex});
  let transition: Transition = 'none';
  let direction: Direction = 'forward';
  if (lastSlot.key !== slotKey) {
    if (lastSlot.key === 'covered') {
      // No card on its way out means the card left at once: the content is there at once too.
      transition = shell?.returning ?? 'none';
      direction = 'backward';
    } else if (!covered) {
      transition = side ? 'refresh' : 'slide_right';
      direction = selectedIndex >= lastSlot.index ? 'forward' : 'backward';
    }
    setLastSlot({key: slotKey, index: selectedIndex});
  }
  const arriving = useArrival(slotKey, transition, direction, room);
  return (
    <View style={[styles.root, side && styles.row]} onLayout={onLayout} testID="tabs">
      {!hidden ? (
        <XamlNavigationView
          items={tabItems(routes)}
          selectedIndex={selectedIndex}
          paneMode={side ? (open ? 'left' : 'compact') : 'top'}
          background={background}
          backButton={canGoBack ? 'enabled' : host ? 'disabled' : 'hidden'}
          onSelectionChange={event => {
            const route = routes[event.nativeEvent.index];
            if (!route) return;
            if (covered) shell?.popAll();
            if (route.name !== current) navigation.navigate(route.name);
          }}
          onItemInvoked={event => {
            // The section already selected: back to its root, as the Settings app goes.
            if (event.nativeEvent.index !== selectedIndex) return;
            if (covered) shell?.popAll();
            inner?.popToTop();
          }}
          onBackRequested={() => (covered ? shell?.goBack() : inner?.goBack())}
          onPaneOpenChange={event => setToggle({pane: resolved, open: event.nativeEvent.open})}
          style={
            side
              ? [styles.pane, {width: open ? PANE_WIDTH.open : PANE_WIDTH.compact}]
              : [styles.bar, chrome.extended && {marginLeft: chrome.insets.left, marginRight: chrome.insets.right}]
          }
          testID="tab-bar"
          {...xaml}
        />
      ) : null}
      <View style={styles.slot}>
        <BackStoreContext.Provider value={hidden ? null : store}>
          {shell?.leaving && !shell.leavingOnTop ? shell.leaving : null}
          {shell?.card ?? (
            <Animated.View key={slotKey} style={[styles.slot, arriving]}>
              <Navigator.Slot/>
            </Animated.View>
          )}
          {shell?.leavingOnTop ? shell.leaving : null}
        </BackStoreContext.Provider>
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
