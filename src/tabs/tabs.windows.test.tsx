import type {TabRoute} from './types';
import type {StyleProp, ViewStyle} from 'react-native';
import {act, fireEvent, screen} from '@testing-library/react-native';
import {Animated, Dimensions, StyleSheet, Text} from 'react-native';
import {router} from 'expo-router';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {renderApp} from 'expo-vitest/router';
import {TabStack} from '../tab-stack';
import {PANE_BREAKPOINT, PANE_WIDTH, resolvePane, tabItems, Tabs} from './index.windows';

const NAV = 'ExpoInterfaceNavigationView';

/** The window's chrome as the test wants it: the system title bar, or the content extended into it with the caption buttons' insets. */
const chrome = vi.hoisted(() => ({state: {extended: false, insets: {left: 0, right: 0, height: 0}}}));
vi.mock('../windows/chrome', async importOriginal => ({
  ...(await importOriginal<typeof import('../windows/chrome')>()),
  useWindowChromeState: () => chrome.state,
}));

const routes: TabRoute[] = [
  {href: '/', name: 'index', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
  {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
];

const app = (props: Record<string, unknown> = {}) => ({
  _layout: () => <Tabs routes={routes} {...props}/>,
  index: () => <Text>Home screen</Text>,
  settings: () => <Text>Settings screen</Text>,
});

const WINDOW = Dimensions.get('window');

/** Lays the tabs out at a width, as a window resize does. */
async function layout(width: number) {
  await fireEvent(screen.getByTestId('tabs'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width, height: 600}}});
}

function widthOf(node: {props: {style?: StyleProp<ViewStyle>}}): number | undefined {
  return StyleSheet.flatten(node.props.style)?.width as number | undefined;
}

/** Every motion over at once, so a screen leaving is gone when the navigation is; the motion tests hold or count the timings instead. */
beforeEach(() => {
  vi.spyOn(Animated, 'timing').mockImplementation(() => ({start: (callback?: (result: {finished: boolean}) => void) => callback?.({finished: true})}) as never);
});

afterEach(() => {
  Dimensions.set({window: WINDOW});
});

describe('Tabs (windows)', () => {
  it('renders a NavigationView island of the routes over the focused screen', async () => {
    await renderApp(app());
    const bar = island(NAV);
    expect(JSON.parse(bar.props.items)).toEqual([{label: 'Home', glyph: 'E80F'}, {label: 'Settings', glyph: 'E713'}]);
    expect(bar.props.selectedIndex).toBe(0);
    expect(bar.props.paneMode).toBe('top');
    expect(bar.props.background).toEqual(expect.any(String));
    expect(bar.props.testID).toBe('tab-bar');
    expect(widthOf(bar)).toBeUndefined();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(screen.queryByText('Settings screen')).toBeNull();
  });

  it('navigates from a selection in the bar, and follows the router', async () => {
    await renderApp(app());
    await fireIsland(island(NAV), 'selectionChange', {index: 1});
    expect(screen.getByText('Settings screen')).toBeOnTheScreen();
    expect(island(NAV).props.selectedIndex).toBe(1);
    // The current tab again, or an index with no route, is no navigation.
    await fireIsland(island(NAV), 'selectionChange', {index: 1});
    await fireIsland(island(NAV), 'selectionChange', {index: 7});
    expect(screen.getByText('Settings screen')).toBeOnTheScreen();
    await act(async () => router.push('/'));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(island(NAV).props.selectedIndex).toBe(0);
  });

  it('drops the bar but keeps the screens when hidden', async () => {
    await renderApp(app({hidden: true}));
    expect(islands(NAV)).toHaveLength(0);
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('leaves the caption buttons their room at the top bar\'s end while the content is in the title bar', async () => {
    chrome.state = {extended: true, insets: {left: 0, right: 138, height: 32}};
    try {
      await renderApp(app());
      expect(StyleSheet.flatten(island(NAV).props.style)).toMatchObject({marginLeft: 0, marginRight: 138});
    } finally {
      chrome.state = {extended: false, insets: {left: 0, right: 0, height: 0}};
    }
  });

  it('leaves a side pane alone while the content is in the title bar: the caption buttons are over the content beside it', async () => {
    chrome.state = {extended: true, insets: {left: 0, right: 138, height: 32}};
    try {
      await renderApp(app({windowsPane: 'left'}));
      expect(StyleSheet.flatten(island(NAV).props.style).marginRight).toBeUndefined();
    } finally {
      chrome.state = {extended: false, insets: {left: 0, right: 0, height: 0}};
    }
  });

  it('carries a badge and a placement in the items, only where a tab has one', () => {
    const icon = {ios: 'house', android: 'home', web: 'home'} as const;
    expect(JSON.parse(tabItems([
      {href: '/', name: 'inbox', label: 'Inbox', icon, badge: 3},
      {href: '/new', name: 'new', label: 'New', icon, badge: 'new', windowsPlacement: 'menu'},
      {href: '/help', name: 'help', label: 'Help', icon, badge: 0, windowsPlacement: 'footer'},
      {href: '/settings', name: 'settings', label: 'Settings', icon, windowsPlacement: 'settings'},
    ]))).toEqual([
      {label: 'Inbox', glyph: 'E80F', badge: 3},
      {label: 'New', glyph: 'E80F', badge: 'new'},
      {label: 'Help', glyph: 'E80F', placement: 'footer'},
      {label: 'Settings', glyph: 'E80F', placement: 'settings'},
    ]);
  });

  it('leaves a tab without a Fluent glyph blank', () => {
    expect(JSON.parse(tabItems([{href: '/', name: 'odd', label: 'Odd', icon: {ios: 'house', android: 'nope' as never, web: 'nope' as never}}]))).toEqual([{label: 'Odd', glyph: null}]);
  });
});

describe('Tabs pane (windows)', () => {
  it('draws the expanded pane down the left, and answers its toggle button with the compact mode and width, and back', async () => {
    await renderApp(app({windowsPane: 'left'}));
    const bar = island(NAV);
    expect(bar.props.paneMode).toBe('left');
    expect(bar).toHaveStyle({width: PANE_WIDTH.open, alignSelf: 'stretch'});
    await fireIsland(bar, 'paneOpenChange', {open: false});
    expect(island(NAV).props.paneMode).toBe('compact');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.compact);
    await fireIsland(island(NAV), 'paneOpenChange', {open: true});
    expect(island(NAV).props.paneMode).toBe('left');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.open);
    // The screens beside it navigate as under the bar.
    await fireIsland(island(NAV), 'selectionChange', {index: 1});
    expect(screen.getByText('Settings screen')).toBeOnTheScreen();
  });

  it('draws the compact pane at its glyph width, and answers its toggle button with the expanded mode and width', async () => {
    await renderApp(app({windowsPane: 'compact'}));
    expect(island(NAV).props.paneMode).toBe('compact');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.compact);
    await fireIsland(island(NAV), 'paneOpenChange', {open: true});
    expect(island(NAV).props.paneMode).toBe('left');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.open);
    await fireIsland(island(NAV), 'paneOpenChange', {open: false});
    expect(island(NAV).props.paneMode).toBe('compact');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.compact);
  });

  it('picks the pane by the width in auto — the window\'s first, then its own layout — and a toggle belongs to the pane it was made in', async () => {
    Dimensions.set({window: {...WINDOW, width: 1200}});
    await renderApp(app({windowsPane: 'auto'}));
    expect(island(NAV).props.paneMode).toBe('left');
    await fireIsland(island(NAV), 'paneOpenChange', {open: false});
    expect(island(NAV).props.paneMode).toBe('compact');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.compact);
    // Under the expanded breakpoint the pane is compact by WinUI's rule.
    await layout(800);
    expect(island(NAV).props.paneMode).toBe('compact');
    await fireIsland(island(NAV), 'paneOpenChange', {open: true});
    expect(island(NAV).props.paneMode).toBe('left');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.open);
    // Over it again: the expanded pane, open, whatever the compact one was toggled to.
    await layout(1200);
    expect(island(NAV).props.paneMode).toBe('left');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.open);
    // Under it again, the compact pane remembers it was opened.
    await layout(800);
    expect(island(NAV).props.paneMode).toBe('left');
    expect(widthOf(island(NAV))).toBe(PANE_WIDTH.open);
    // Under the compact breakpoint the bar goes along the top.
    await layout(500);
    expect(island(NAV).props.paneMode).toBe('top');
    expect(widthOf(island(NAV))).toBeUndefined();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it("resolves auto at WinUI's breakpoints and leaves a fixed pane alone", () => {
    expect(resolvePane('auto', PANE_BREAKPOINT.expanded)).toBe('left');
    expect(resolvePane('auto', PANE_BREAKPOINT.expanded - 1)).toBe('compact');
    expect(resolvePane('auto', PANE_BREAKPOINT.compact)).toBe('compact');
    expect(resolvePane('auto', PANE_BREAKPOINT.compact - 1)).toBe('top');
    expect(resolvePane('left', 100)).toBe('left');
    expect(resolvePane('top', 2000)).toBe('top');
  });
});

describe('Tabs back button (windows)', () => {
  const stacked = () => ({
    _layout: () => <Tabs routes={routes}/>,
    'index/_layout': () => <TabStack title="Home"/>,
    'index/index': () => <Text>Home screen</Text>,
    'index/deeper': () => <Text>Deeper screen</Text>,
    settings: () => <Text>Settings screen</Text>,
  });

  it('draws none while the tabs are the root and nothing can pop, and a press then does nothing', async () => {
    await renderApp(app());
    expect(island(NAV).props.backButton).toBe('hidden');
    await fireIsland(island(NAV), 'backRequested');
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('takes the back of a stack inside a tab while it can pop', async () => {
    await renderApp(stacked());
    expect(island(NAV).props.backButton).toBe('hidden');
    await act(async () => router.push('/deeper'));
    expect(island(NAV).props.backButton).toBe('enabled');
    expect(screen.queryByLabelText('Go back')).toBeNull();
    await fireIsland(island(NAV), 'backRequested');
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(island(NAV).props.backButton).toBe('hidden');
  });
});

describe('Tabs motion and presses (windows)', () => {
  const stacked = () => ({
    _layout: () => <Tabs routes={routes}/>,
    'index/_layout': () => <TabStack title="Home"/>,
    'index/index': () => <Text>Home screen</Text>,
    'index/deeper': () => <Text>Deeper screen</Text>,
    settings: () => <Text>Settings screen</Text>,
  });

  it('moves the content along the top bar on a selection, forward and back, on the native driver', async () => {
    const timing = vi.spyOn(Animated, 'timing').mockReturnValue({start: vi.fn()} as never);
    await renderApp(app());
    expect(timing).not.toHaveBeenCalled();
    await fireIsland(island(NAV), 'selectionChange', {index: 1});
    expect(timing).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({duration: 250, useNativeDriver: true}));
    await fireIsland(island(NAV), 'selectionChange', {index: 0});
    expect(timing).toHaveBeenCalledTimes(2);
  });

  it('refreshes the content in a side pane', async () => {
    const timing = vi.spyOn(Animated, 'timing').mockReturnValue({start: vi.fn()} as never);
    await renderApp(app({windowsPane: 'left'}));
    await fireIsland(island(NAV), 'selectionChange', {index: 1});
    expect(timing).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Settings screen')).toBeOnTheScreen();
  });

  it("returns to the section's root on a press of the selected item, and ignores a press on another", async () => {
    await renderApp(stacked());
    // At the root already: nothing to do.
    await fireIsland(island(NAV), 'itemInvoked', {index: 0});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await act(async () => router.push('/deeper'));
    expect(screen.getByText('Deeper screen')).toBeOnTheScreen();
    await fireIsland(island(NAV), 'itemInvoked', {index: 1});
    expect(screen.getByText('Deeper screen')).toBeOnTheScreen();
    await fireIsland(island(NAV), 'itemInvoked', {index: 0});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(screen.queryByText('Deeper screen')).toBeNull();
  });
});
