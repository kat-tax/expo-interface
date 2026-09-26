import type {LayoutChangeEvent} from 'react-native';
import type {Direction, Transition} from '../windows/motion';
import type {TabBarProps, TabRoute, WindowsPane} from './types';
import {useCallback, useContext, useEffect, useState, useSyncExternalStore} from 'react';
import {Navigator, TabRouter} from 'expo-router';
import {Animated, Pressable, StyleSheet, View, useWindowDimensions} from 'react-native';
import XamlNavigationView from '../windows/specs/ExpoInterfaceNavigationViewNativeComponent';
import {jsonProp, useXamlProps} from '../windows';
import {useWindowChromeState} from '../windows/chrome';
import {useLayerDismiss} from '../windows/layer';
import {useArrival} from '../windows/motion';
import {windowsGlyph} from '../symbol/segoe';
import {useColor} from '../theme';
import {BackStoreContext, PaneToggleContext, ShellCardsContext, ShellHostContext, createBackStore} from './shell';

/** The pane a tab bar resolves to: the row along the top, or the side pane, expanded, compact or minimal. */
export type ResolvedPane = 'top' | 'left' | 'compact' | 'minimal';

/** WinUI's pane widths — `OpenPaneLength` and `CompactPaneLength` — which the island is sized to beside or over the content. */
export const PANE_WIDTH = {open: 320, compact: 48} as const;

/** WinUI's adaptive `NavigationView` breakpoints: the expanded pane from 1008 points of width, the compact one from 641. */
export const PANE_BREAKPOINT = {expanded: 1008, compact: 641} as const;

/**
 * The pane a request resolves to at a width. `auto` decides as WinUI's
 * adaptive `NavigationView` does: the expanded pane from the expanded
 * breakpoint, the compact pane from the compact one, and the minimal pane
 * in a narrower window.
 */
export function resolvePane(pane: WindowsPane, width: number): ResolvedPane {
  if (pane !== 'auto') return pane;
  if (width >= PANE_BREAKPOINT.expanded) return 'left';
  if (width >= PANE_BREAKPOINT.compact) return 'compact';
  return 'minimal';
}

/**
 * Windows: a WinUI 3 `NavigationView` — the platform's tab bar, a row of
 * items along the top of the window, or with `windowsPane` the navigation
 * pane down the left side in one of WinUI's three modes — beside or over the
 * focused tab's screens. The routes are Expo Router's, driven by a custom
 * navigator on the tab router (no native tabs, which react-native-screens
 * does not draw on Windows), so `Link`, `useRouter` and the rest work as
 * they do anywhere. `hidden` drops the bar and leaves the screens.
 *
 * The expanded pane's toggle button collapses it to its glyphs beside the
 * content and opens it again: WinUI flips the pane, and the kit answers with
 * the island's width and the matching mode, expanded or compact. The compact
 * pane's toggle button opens the pane over the content, and the minimal
 * pane's, the only part of it drawn until then, does the same: the kit
 * widens the island over the content, the pane opens inside it, and a
 * selection, a press beside the pane or Escape closes it.
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

/** The tabs' own size, from their layout. */
interface Measured {
  width: number;
  height: number;
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
  const {width: windowWidth} = useWindowDimensions();
  const [measured, setMeasured] = useState<Measured | null>(null);
  const resolved = resolvePane(pane, measured?.width ?? windowWidth);
  const side = resolved !== 'top';
  // The two panes that open over the content rather than beside it.
  const overlay = resolved === 'compact' || resolved === 'minimal';
  // What the pane's toggle button last did, while the pane it did it in stays
  // resolved: another pane starts as WinUI's adaptive layout starts it, the
  // expanded one open, the others closed.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const [lastResolved, setLastResolved] = useState(resolved);
  if (lastResolved !== resolved) {
    setLastResolved(resolved);
    setToggled(null);
  }
  const open = toggled ?? resolved === 'left';
  const close = useCallback(() => setToggled(false), []);
  const drawn = !hidden;
  // A pane open over the content: closed by a press beside it, or by Escape from wherever the focus is under the kit's stack.
  const covering = drawn && overlay && open;
  useLayerDismiss(covering ? close : undefined);
  // The minimal pane's toggle row, as wide as its island measured while closed; the content's header starts after it.
  const [toggleRow, setToggleRow] = useState(0);
  const onIslandLayout = (event: LayoutChangeEvent) => {
    if (resolved === 'minimal' && !open) setToggleRow(event.nativeEvent.layout.width);
  };
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
  const arriving = useArrival(slotKey, transition, direction);
  // Where the island goes: along the top, beside the content at the pane's
  // width, over the content at the pane's width or the compact strip's, or
  // at the top start corner at the size its toggle row reports.
  let islandStyle;
  if (resolved === 'top') islandStyle = [styles.bar, chrome.extended && {marginLeft: chrome.insets.left, marginRight: chrome.insets.right}];
  else if (resolved === 'left') islandStyle = [styles.pane, {width: open ? PANE_WIDTH.open : PANE_WIDTH.compact}];
  else if (resolved === 'compact') islandStyle = [styles.over, {width: open ? PANE_WIDTH.open : PANE_WIDTH.compact}];
  else islandStyle = open ? [styles.over, {width: PANE_WIDTH.open}] : styles.corner;
  const bar = drawn ? (
    <XamlNavigationView
      items={tabItems(routes)}
      selectedIndex={selectedIndex}
      paneMode={resolved === 'left' && !open ? 'compact' : resolved}
      paneOpen={overlay ? open : undefined}
      paneHeight={resolved === 'minimal' ? measured?.height : undefined}
      background={background}
      backButton={canGoBack ? 'enabled' : host ? 'disabled' : 'hidden'}
      onSelectionChange={event => {
        const route = routes[event.nativeEvent.index];
        if (!route) return;
        if (covered) shell?.popAll();
        if (route.name !== current) navigation.navigate(route.name);
        // A pane over the content has done its work, as WinUI's closes on a selection.
        if (overlay) close();
      }}
      onItemInvoked={event => {
        // The section already selected: back to its root, as the Settings app goes.
        if (event.nativeEvent.index !== selectedIndex) return;
        if (covered) shell?.popAll();
        inner?.popToTop();
      }}
      onBackRequested={() => (covered ? shell?.goBack() : inner?.goBack())}
      onPaneOpenChange={event => setToggled(event.nativeEvent.open)}
      onLayout={onIslandLayout}
      style={islandStyle}
      testID="tab-bar"
      {...xaml}
    />
  ) : null;
  return (
    <View style={[styles.root, resolved === 'left' && styles.row]} onLayout={onLayout} testID="tabs">
      {!overlay ? bar : null}
      <View style={[styles.slot, drawn && resolved === 'compact' && styles.besideStrip]} testID="tabs-content">
        <PaneToggleContext.Provider value={drawn && resolved === 'minimal' ? toggleRow : 0}>
          <BackStoreContext.Provider value={hidden ? null : store}>
            {shell?.leaving && !shell.leavingOnTop ? shell.leaving : null}
            {shell?.card ?? (
              <Animated.View key={slotKey} style={[styles.slot, arriving]}>
                <Navigator.Slot/>
              </Animated.View>
            )}
            {shell?.leavingOnTop ? shell.leaving : null}
          </BackStoreContext.Provider>
        </PaneToggleContext.Provider>
      </View>
      {covering ? <Pressable style={styles.smoke} onPress={close} accessibilityLabel="Close the navigation pane" role="button" testID="pane-smoke"/> : null}
      {overlay ? bar : null}
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
  // The content beside the compact strip, which the pane opens over.
  besideStrip: {
    marginStart: PANE_WIDTH.compact,
  },
  // A pane over the content, down the start side.
  over: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
  },
  // The minimal pane closed: its toggle row at the top start corner, at the size the island reports.
  corner: {
    position: 'absolute',
    top: 0,
    start: 0,
  },
  // What is beside an open overlay pane: a press there closes it, as WinUI's light dismiss does.
  smoke: {
    ...StyleSheet.absoluteFill,
  },
});
