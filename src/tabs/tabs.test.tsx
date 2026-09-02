import type {TabRoute} from './types';
import {Platform, Text} from 'react-native';
import {screen as dom} from '@testing-library/react';
import {screen} from '@testing-library/react-native';
import Constants from 'expo-constants';
import {colors} from '../theme';
import {nodes} from '../__tests__/native';
import {renderApp} from '../__tests__/router';

const routes: TabRoute[] = [
  {href: '/', name: 'index', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
  {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
];

// `Tabs` is imported lazily: on web the module graph reaches `expo-router/ui`,
// which the web project cannot load (see the skip note below), and a static
// import would fail the whole suite at collection.
const app = async (props: Record<string, any> = {}) => {
  const {Tabs} = await import('.');
  return {
    _layout: () => <Tabs routes={routes} {...props}/>,
    index: () => <Text>Home screen</Text>,
    settings: () => <Text>Settings screen</Text>,
  };
};

describe(`Tabs (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    const appName = String(Constants.expoConfig?.name);

    // SKIPPED until vitest.config.web.mts can load `expo-router/ui`:
    // the subpath is not in the dependency optimizer's include list, so it is
    // externalized to Node, whose ESM loader rejects expo-modules-core's
    // TypeScript entry ("Stripping types is currently unsupported for files
    // under node_modules"). Adding 'expo-router/ui' to the include list gets
    // it bundled, but its `__exportStar(require("./Tabs"))` CJS shim defeats
    // the optimizer's named-export detection and every export comes back
    // `undefined`. Both need config-level work; the specs stay written so
    // they can be re-enabled by deleting `.skip`.
    describe.skip('web tab bar', () => {
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
