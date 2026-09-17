import type {TabRoute} from './types';
import type {StyleProp, ViewStyle} from 'react-native';
import {act, fireEvent, screen} from '@testing-library/react-native';
import {Dimensions, StyleSheet, Text} from 'react-native';
import {router} from 'expo-router';
import {fireIsland, island, islands} from '../__tests__/windows';
import {renderApp} from '../__tests__/router';
import {PANE_BREAKPOINT, PANE_WIDTH, resolvePane, tabItems, Tabs} from './index.windows';

const NAV = 'ExpoInterfaceNavigationView';

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
