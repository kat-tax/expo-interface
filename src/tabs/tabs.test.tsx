import type {TabRoute} from './types';
import {Platform, Text} from 'react-native';
import {screen as dom} from '@testing-library/react';
import {screen} from '@testing-library/react-native';
import Constants from 'expo-constants';
import {colors} from '../theme';
import {nodes} from '../../jest/native';
import {renderApp} from '../__tests__/router';
import {Tabs} from '.';

const routes: TabRoute[] = [
  {href: '/', name: 'index', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
  {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
];

const app = (props: Partial<React.ComponentProps<typeof Tabs>> = {}) => ({
  _layout: () => <Tabs routes={routes} {...props}/>,
  index: () => <Text>Home screen</Text>,
  settings: () => <Text>Settings screen</Text>,
});

describe(`Tabs (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    const appName = String(Constants.expoConfig?.name);

    it('renders a floating bar link per route around the active screen', async () => {
      await renderApp(app());
      const links = dom.getAllByRole('link');
      expect(links.map(l => l.getAttribute('href'))).toEqual(['/', '/settings']);
      expect(links.map(l => l.textContent)).toEqual(['Home', 'Settings']);
      expect(dom.getByText('Home screen')).toBeInTheDocument();
      expect(dom.queryByText('Settings screen')).toBeNull();
    });

    it('shows the app name by default and drops the icon when none is given', async () => {
      await renderApp(app());
      expect(dom.getByText(appName)).toBeInTheDocument();
      expect(document.querySelector('img')).toBeNull();
    });

    it('renders the app icon for icon presets', async () => {
      await renderApp(app({webLogo: 'icon-and-text', webIcon: {uri: 'https://example.com/icon.png'}}));
      expect(document.querySelector('img')).not.toBeNull();
      expect(dom.getByText(appName)).toBeInTheDocument();
    });

    it('hides the name in icon-only mode', async () => {
      await renderApp(app({webLogo: 'icon-only', webIcon: {uri: 'https://example.com/icon.png'}}));
      expect(document.querySelector('img')).not.toBeNull();
      expect(dom.queryByText(appName)).toBeNull();
    });

    it('hides the icon in text-only mode', async () => {
      await renderApp(app({webLogo: 'text-only', webIcon: {uri: 'https://example.com/icon.png'}}));
      expect(document.querySelector('img')).toBeNull();
      expect(dom.getByText(appName)).toBeInTheDocument();
    });

    it('replaces the presets with a custom logo node', async () => {
      await renderApp(app({webLogo: <Text testID="logo">Acme</Text>, webIcon: {uri: 'https://example.com/icon.png'}}));
      expect(dom.getByTestId('logo').textContent).toBe('Acme');
      expect(dom.queryByText(appName)).toBeNull();
      expect(document.querySelector('img')).toBeNull();
    });
  } else {
    const isIOS = Platform.OS === 'ios';
    const triggers = () => nodes().filter(n => n.type === (isIOS ? 'RNSTabsScreenIOS' : 'RNSTabsScreenAndroid'));

    it('renders a native tab per route with its label and symbol', async () => {
      await renderApp(app());
      const tabs = triggers();
      expect(tabs.map(t => t.props.title)).toEqual(['Home', 'Settings']);
      if (isIOS) {
        expect(tabs.map(t => t.props.icon)).toEqual([{sf: 'house'}, {sf: 'gearshape'}]);
      }
      expect(screen.getByText('Home screen')).toBeOnTheScreen();
    });

    it('themes the tab bar with the palette', async () => {
      await renderApp(app());
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
