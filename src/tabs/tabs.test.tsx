import type {TabRoute} from './types';
import {Platform, Text} from 'react-native';
import {act, fireEvent, screen as dom, waitFor} from '@testing-library/react';
import {screen} from '@testing-library/react-native';
import Constants from 'expo-constants';
import {router} from 'expo-router';
import {colors} from '../theme';
import {nodes} from '../__tests__/native';
import {renderApp} from '../__tests__/router';

const routes: TabRoute[] = [
  {href: '/', name: 'index', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
  {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
];

// `Tabs` is imported lazily so the native `react-native-screens` mock below
// is extended before `expo-router/unstable-native-tabs` loads.
const app = async (props: Record<string, any> = {}) => {
  const {Tabs} = await import('.');
  return {
    _layout: () => <Tabs routes={routes} {...props}/>,
    index: () => <Text>Home screen</Text>,
    settings: () => <Text>Settings screen</Text>,
  };
};

/** A tab holding a `TabStack`, whose screens hand their header to the bar. */
const stackApp = async (props: Record<string, any> = {}) => {
  const {Tabs} = await import('.');
  const {TabStack} = await import('../tab-stack');
  const stacked: TabRoute[] = [{...routes[0], href: '/home', name: 'home'}, routes[1]];
  return {
    _layout: () => <Tabs routes={stacked} {...props}/>,
    'home/_layout': () => <TabStack title="Drops" headerRight={() => <Text testID="new">New…</Text>}/>,
    'home/index': () => <Text>Home screen</Text>,
    'home/detail': () => <Text>Detail screen</Text>,
    settings: () => <Text>Settings screen</Text>,
  };
};

describe(`Tabs (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    const appName = String(Constants.expoConfig?.name);

    // `expo-router/ui` reaches the web project through the alias in
    // vitest.config.web.mts: its ESM stub over a CJS module yields no named
    // exports once pre-bundled, so the CJS entry is loaded directly.
    describe('web tab bar', () => {
      it('renders a floating bar link per route around the active screen', async () => {
        await renderApp(await app());
        const links = dom.getAllByRole('link');
        expect(links.map(l => l.getAttribute('href'))).toEqual(['/', '/settings']);
        expect(links.map(l => l.textContent)).toEqual(['Home', 'Settings']);
        expect(dom.getByText('Home screen')).toBeInTheDocument();
        expect(dom.queryByText('Settings screen')).toBeNull();
      });

      it('shows the app name by default and drops the icon when none is given', async () => {
        await renderApp(await app());
        expect(dom.getByText(appName)).toBeInTheDocument();
        expect(document.querySelector('img')).toBeNull();
      });

      it('renders the app icon for icon presets', async () => {
        await renderApp(await app({webLogo: 'icon-and-text', webIcon: {uri: 'https://example.com/icon.png'}}));
        expect(document.querySelector('img')).not.toBeNull();
        expect(dom.getByText(appName)).toBeInTheDocument();
      });

      it('hides the name in icon-only mode', async () => {
        await renderApp(await app({webLogo: 'icon-only', webIcon: {uri: 'https://example.com/icon.png'}}));
        expect(document.querySelector('img')).not.toBeNull();
        expect(dom.queryByText(appName)).toBeNull();
      });

      it('hides the icon in text-only mode', async () => {
        await renderApp(await app({webLogo: 'text-only', webIcon: {uri: 'https://example.com/icon.png'}}));
        expect(document.querySelector('img')).toBeNull();
        expect(dom.getByText(appName)).toBeInTheDocument();
      });

      it('replaces the presets with a custom logo node', async () => {
        await renderApp(await app({webLogo: <Text testID="logo">Acme</Text>, webIcon: {uri: 'https://example.com/icon.png'}}));
        expect(dom.getByTestId('logo').textContent).toBe('Acme');
        expect(dom.queryByText(appName)).toBeNull();
        expect(document.querySelector('img')).toBeNull();
      });

      it('hides the bar but keeps the routes when hidden', async () => {
        await renderApp(await app({hidden: true}));
        const links = dom.getAllByRole('link', {hidden: true});
        expect(links).toHaveLength(2);
        // The bar is display: none; the routes stay in it and the active screen renders.
        expect(getComputedStyle(dom.getByTestId('tab-bar')).display).toBe('none');
        expect(dom.getByText('Home screen')).toBeInTheDocument();
      });

      it('renders actions between the logo and the tabs, or after them', async () => {
        await renderApp(await app({webActions: <Text testID="actions">New…</Text>}));
        const actions = dom.getByTestId('actions');
        const [home] = dom.getAllByRole('link');
        expect(actions.compareDocumentPosition(home) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(dom.getByText(appName).compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });

      it('renders actions after the tabs on request', async () => {
        await renderApp(await app({webActions: <Text testID="actions">New…</Text>, webActionsPlacement: 'after'}));
        const actions = dom.getByTestId('actions');
        const [, settings] = dom.getAllByRole('link');
        expect(settings.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });

      it('lets the logo slot shrink before the tabs', async () => {
        await renderApp(await app({webLogo: <Text testID="logo">A very long document title that must be bounded</Text>}));
        const logo = dom.getByTestId('logo').parentElement!;
        const style = getComputedStyle(logo);
        expect(style.flexShrink).toBe('1');
        expect(style.minWidth).toBe('0px');
      });

      it('folds a tab screen header into the bar instead of drawing one under it', async () => {
        await renderApp(await stackApp(), '/home');
        const bar = dom.getByTestId('tab-bar');
        // The title and the trailing slot are the bar's; there is no second row.
        expect(bar.contains(dom.getByText('Drops'))).toBe(true);
        expect(bar.contains(dom.getByTestId('new'))).toBe(true);
        expect(dom.getAllByText('Drops')).toHaveLength(1);
        // The title takes the app name's place; a mark beside it would stay.
        expect(dom.queryByText(appName)).toBeNull();
        expect(dom.getByText('Home screen')).toBeInTheDocument();
      });

      it('keeps one height whatever a screen folds into it', async () => {
        await renderApp(await stackApp(), '/home');
        expect(getComputedStyle(dom.getByTestId('tab-bar-row')).height).toBe('56px');
      });

      it('gives a pushed screen a back button in the bar', async () => {
        await renderApp(await stackApp(), '/home');
        expect(dom.queryByLabelText('Go back')).toBeNull();
        await act(async () => router.push('/home/detail'));
        const bar = dom.getByTestId('tab-bar');
        expect(bar.contains(dom.getByText('detail'))).toBe(true);
        const back = dom.getByLabelText('Go back');
        expect(bar.contains(back)).toBe(true);

        // It dims while it is held, like the bar's own links.
        fireEvent.mouseDown(back);
        await waitFor(() => expect(getComputedStyle(back).opacity).toBe('0.7'));
        fireEvent.mouseUp(back);
        expect(getComputedStyle(back).opacity).not.toBe('0.7');

        fireEvent.click(back);
        expect(dom.queryByText('detail')).toBeNull();
        expect(dom.getByText('Drops')).toBeInTheDocument();
      });

      it('keeps the bar as the header while the tabs are hidden', async () => {
        await renderApp(await stackApp({hidden: true}), '/home');
        expect(getComputedStyle(dom.getByTestId('tab-bar')).display).not.toBe('none');
        expect(getComputedStyle(dom.getByTestId('tab-bar-tabs')).display).toBe('none');
        expect(dom.getByTestId('tab-bar').contains(dom.getByText('Drops'))).toBe(true);
      });

      it('leaves the header to the screen when the fold is off', async () => {
        await renderApp(await stackApp({webFoldHeader: false}), '/home');
        expect(dom.getByTestId('tab-bar').contains(dom.getByText('Drops'))).toBe(false);
        expect(dom.getByText(appName)).toBeInTheDocument();
      });

      it('dims a link while it is pressed', async () => {
        await renderApp(await app());
        const [home] = dom.getAllByRole('link');
        fireEvent.mouseDown(home);
        // react-native-web enters the pressed state after its 50ms press delay.
        await waitFor(() => expect(getComputedStyle(home).opacity).toBe('0.7'));
        fireEvent.mouseUp(home);
        expect(getComputedStyle(home).opacity).not.toBe('0.7');
      });
    });
  } else {
    const isIOS = Platform.OS === 'ios';
    const triggers = () => nodes().filter(n => n.type === (isIOS ? 'RNSTabsScreenIOS' : 'RNSTabsScreenAndroid'));

    // vitest-native's react-native-screens mock predates the `Tabs.Host` /
    // `Tabs.Screen` compound API that SDK 57's NativeTabs renders (plus the
    // `react-native-screens/experimental` SafeAreaView expo-router wraps
    // Android tab content in — subpath requires resolve to the same mock), so
    // model them as named host views carrying the tab payload as props.
    beforeAll(async () => {
      const {createElement} = await import('react');
      const {extendPresetMock} = await import('vitest-native/helpers');
      const el = (name: string) => {
        const Host = (props: Record<string, any>) =>
          createElement(name, props, props.children);
        Host.displayName = name;
        return Host;
      };
      extendPresetMock('react-native-screens', {
        SafeAreaView: el('RNSSafeAreaView'),
        Tabs: {
          Host: el('RNSTabsHost'),
          Screen: el(isIOS ? 'RNSTabsScreenIOS' : 'RNSTabsScreenAndroid'),
        },
      });
    });

    it('renders a native tab per route with its label and symbol', async () => {
      await renderApp(await app());
      const tabs = triggers();
      expect(tabs.map(t => t.props.title)).toEqual(['Home', 'Settings']);
      if (isIOS) {
        expect(tabs.map(t => t.props.icon)).toEqual([{sf: 'house'}, {sf: 'gearshape'}]);
      }
      expect(screen.getByText('Home screen')).toBeOnTheScreen();
    });

    it('passes hidden to the native tab bar', async () => {
      await renderApp(await app({hidden: true}));
      expect(triggers()).toHaveLength(2);
      expect(screen.getByText('Home screen')).toBeOnTheScreen();
    });

    it('themes the tab bar with the palette', async () => {
      await renderApp(await app());
      for (const tab of triggers()) {
        expect(tab.props).toMatchObject({
          backgroundColor: 'transparent',
          indicatorColor: colors.light.backgroundElement,
          rippleColor: colors.light.pillBackground,
          selectedIconColor: colors.light.label,
          selectedLabelStyle: {color: colors.light.label},
        });
      }
    });
  }
});
