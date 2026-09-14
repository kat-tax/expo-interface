import type {TabRoute} from './types';
import {act, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {router} from 'expo-router';
import {fireIsland, island, islands} from '../__tests__/windows';
import {renderApp} from '../__tests__/router';
import {tabItems, Tabs} from './index.windows';

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

describe('Tabs (windows)', () => {
  it('renders a NavigationView island of the routes over the focused screen', async () => {
    await renderApp(app());
    const bar = island(NAV);
    expect(JSON.parse(bar.props.items)).toEqual([{label: 'Home', glyph: 'E80F'}, {label: 'Settings', glyph: 'E713'}]);
    expect(bar.props.selectedIndex).toBe(0);
    expect(bar.props.testID).toBe('tab-bar');
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
