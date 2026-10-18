import type {TabRoute} from './types';
import {createElement, useEffect, useState} from 'react';
import {Animated, Platform, StyleSheet, Text} from 'react-native';
import {act} from '@testing-library/react';
import {fireEvent as fireNative, render, screen} from '@testing-library/react-native';
import {Stack, router} from 'expo-router';
import * as icons from '../__stories__/icons';
import {HideTabs} from './hide';
import {Screen} from '../screen';
import {useScrollInsets} from '../screen/insets';
import {AppToastFloorContext, AppToastInsetContext} from '../toast/context';
import {colors, inset, spacing} from '../theme';
import {host, modifier, nodes} from 'expo-vitest/native';
import {renderApp} from 'expo-vitest/router';

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

describe(`Tabs (${Platform.OS})`, () => {
  const isIOS = Platform.OS === 'ios';
  const triggers = () => nodes().filter(n => n.type === (isIOS ? 'RNSTabsScreenIOS' : 'RNSTabsScreenAndroid'));
  /** What a screen's scroll content keeps at its bottom, as the last render of `BottomProbe` read it. */
  const seen = {bottom: -1};
  function BottomProbe() {
    const {bottom} = useScrollInsets();
    useEffect(() => {
      seen.bottom = bottom;
    });
    return null;
  }

  /** A named host view carrying its props, standing in for a native view. */
  const el = (name: string) => {
    const Host = (props: Record<string, any>) =>
      createElement(name, props, props.children);
    Host.displayName = name;
    return Host;
  };

  // vitest-native's react-native-screens mock predates the `Tabs.Host` /
  // `Tabs.Screen` compound API that SDK 57's NativeTabs renders (plus the
  // `react-native-screens/experimental` SafeAreaView expo-router wraps
  // Android tab content in — subpath requires resolve to the same mock), so
  // model them as named host views carrying the tab payload as props.
  beforeAll(async () => {
    const {extendPresetMock} = await import('vitest-native/helpers');
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

  it('takes a route\'s icon as a token, the solid form where it asks for it', async () => {
    await renderApp(await app({routes: [{...routes[0], icon: icons.starFilled}, {...routes[1], icon: icons.settings}]}));
    const tabs = triggers();
    if (isIOS) {
      expect(tabs.map(t => t.props.icon)).toEqual([{sf: 'star.fill'}, {sf: 'gearshape'}]);
    } else {
      // Expo Router turns the Material name into a drawable source for Android's bar.
      expect(tabs.map(t => 'src' in t.props.icon)).toEqual([true, true]);
    }
  });

  it('gives a tab the native badge, and none for nothing', async () => {
    await renderApp(await app({routes: [{...routes[0], badge: 3}, {...routes[1], badge: ''}]}));
    const [home, settings] = triggers();
    expect(home.props.badgeValue).toBe('3');
    expect(settings.props.badgeValue).toBeUndefined();
  });

  it('caps a count at badgeMax, and keeps text as it is', async () => {
    await renderApp(await app({routes: [{...routes[0], badge: 120}, {...routes[1], badge: 'new'}]}));
    const [home, settings] = triggers();
    expect(home.props.badgeValue).toBe('99+');
    expect(settings.props.badgeValue).toBe('new');
    await renderApp(await app({routes: [{...routes[0], badge: 12}, routes[1]], badgeMax: 9}));
    expect(triggers()[0].props.badgeValue).toBe('9+');
  });

  it('floats the app\'s action above the tab bar where the bar has no place for it, and lifts a screen\'s fab above it', async () => {
    const onPress = vi.fn();
    const version = Object.getOwnPropertyDescriptor(Platform, 'Version')!;
    Object.defineProperty(Platform, 'Version', {configurable: true, get: () => (isIOS ? '18.0' : 35)});
    const {setInsets} = await import('vitest-native/helpers');
    await act(async () => setInsets({top: 0, left: 0, right: 8, bottom: 20}));
    try {
      await renderApp({
        ...(await app({action: {label: 'New', icon: icons.add, onPress}})),
        index: () => <Screen fab={<Text testID="own">Own</Text>}><BottomProbe/><Text>Home screen</Text></Screen>,
      });
      // The screen's scroll content ends clear of the button: the kit's lists and grids pad by it.
      expect(seen.bottom).toBe(56 + spacing.three);
      const slot = screen.getByTestId('tab-action-slot');
      expect(StyleSheet.flatten(slot.props.style)).toMatchObject({position: 'absolute', right: spacing.three + 8, bottom: inset.bottomTab + 20 + spacing.three});
      if (isIOS) {
        await fireNative.press(screen.getByTestId('tab-action'));
      } else {
        const [view] = screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
        await fireNative(view, 'buttonPressed');
      }
      expect(onPress).toHaveBeenCalledTimes(1);
      // The screen's own button sits above the tabs' one (natively over the safe area, which Android's tab host pays).
      const own = StyleSheet.flatten(screen.getByTestId('screen-fab').props.style);
      expect(own.bottom).toBe(spacing.three + 56 + spacing.three + (isIOS ? 20 : 0));
      // Hidden tabs take their action with them, and the room it took.
      await renderApp({
        ...(await app({hidden: true, action: {label: 'New', icon: icons.add, onPress}})),
        index: () => <Screen><BottomProbe/><Text>Home screen</Text></Screen>,
      });
      expect(screen.queryByTestId('tab-action-slot')).toBeNull();
      expect(seen.bottom).toBe(0);
    } finally {
      Object.defineProperty(Platform, 'Version', version);
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });

  it('lifts its floating action above the app\'s toast while one shows, and lowers it as the toast goes', async () => {
    const version = Object.getOwnPropertyDescriptor(Platform, 'Version')!;
    Object.defineProperty(Platform, 'Version', {configurable: true, get: () => (isIOS ? '18.0' : 35)});
    const timing = vi.spyOn(Animated, 'timing');
    const toast = {cover: (_height: number) => {}};
    try {
      const {Tabs} = await import('.');
      // What a `ToastProvider` around the tabs tells them its toast covers.
      function Layout() {
        const [covered, setCovered] = useState(68);
        useEffect(() => {
          toast.cover = setCovered;
        }, []);
        return (
          <AppToastInsetContext.Provider value={covered}>
            <Tabs routes={routes} action={{label: 'New', icon: icons.add, onPress: vi.fn()}}/>
          </AppToastInsetContext.Provider>
        );
      }
      await renderApp({...(await app()), _layout: Layout});
      // The slot rides a transform by the toast's height, as a screen's fab does, from where it stands.
      expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: -68, useNativeDriver: true}));
      expect(StyleSheet.flatten(screen.getByTestId('tab-action-slot').props.style)).toMatchObject({
        right: spacing.three,
        bottom: inset.bottomTab + spacing.three,
        transform: [{translateY: expect.anything()}],
      });
      await act(async () => toast.cover(0));
      expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: -0}));
    } finally {
      timing.mockRestore();
      Object.defineProperty(Platform, 'Version', version);
    }
  });

  it('tells the app\'s toast what the tab bar takes of the bottom edge, and nothing while it is hidden', async () => {
    const report = vi.fn();
    const {Tabs} = await import('.');
    // What a `ToastProvider` around the tabs hands them to report on.
    const layout = () => (
      <AppToastFloorContext.Provider value={report}>
        <Tabs routes={routes}/>
      </AppToastFloorContext.Provider>
    );
    await renderApp({...(await app()), _layout: layout});
    expect(report).toHaveBeenLastCalledWith(inset.bottomTab);
    // A focused screen hiding the tabs takes the bar from under the toast.
    await renderApp({
      ...(await app()),
      _layout: layout,
      index: () => <><HideTabs/><Text>Home screen</Text></>,
    });
    expect(nodes().find(n => n.type === 'RNSTabsHost')!.props.tabBarHidden).toBe(true);
    expect(report).toHaveBeenLastCalledWith(0);
  });

  it('takes the bar from under the app\'s toast while a stack around the tabs shows a screen over them', async () => {
    const report = vi.fn();
    const {Tabs} = await import('.');
    await renderApp({
      _layout: () => <Stack screenOptions={{headerShown: false}}/>,
      '(tabs)/_layout': () => (
        <AppToastFloorContext.Provider value={report}>
          <Tabs routes={routes}/>
        </AppToastFloorContext.Provider>
      ),
      '(tabs)/index': () => <Text>Home screen</Text>,
      '(tabs)/settings': () => <Text>Settings screen</Text>,
      detail: () => <Text>Detail screen</Text>,
    });
    expect(report).toHaveBeenLastCalledWith(inset.bottomTab);
    // The tabs stay mounted under the pushed screen, which has no bar under it.
    await act(async () => router.push('/detail'));
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    expect(report).toHaveBeenLastCalledWith(0);
    await act(async () => router.back());
    expect(report).toHaveBeenLastCalledWith(inset.bottomTab);
  });

  if (isIOS) {
    it('puts the app\'s action in the tab bar\'s bottom accessory on iOS 26, its icon alone where the accessory is inline', async () => {
      const version = Object.getOwnPropertyDescriptor(Platform, 'Version')!;
      Object.defineProperty(Platform, 'Version', {configurable: true, get: () => '26.0'});
      try {
        await renderApp({
          ...(await app({action: {label: 'New', icon: icons.add, onPress: vi.fn()}})),
          index: () => <Screen><BottomProbe/><Text>Home screen</Text></Screen>,
        });
        expect(screen.queryByTestId('tab-action-slot')).toBeNull();
        // The accessory is the tab bar's own, so the screens keep no room for it.
        expect(seen.bottom).toBe(0);
        const accessory = nodes().find(n => n.type === 'RNSTabsHost')!.props.ios.bottomAccessory as (placement: string) => React.ReactElement;
        await render(accessory('regular'));
        expect(modifier(host(p => p.label === 'New').props, 'labelStyle')).toBeUndefined();
        // Outside the tabs, its measured height goes nowhere.
        await fireNative(screen.getByTestId('tab-accessory'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 300, height: 48}}});
        await render(accessory('inline'));
        expect(modifier(host(p => p.label === 'New').props, 'labelStyle')).toEqual({$type: 'labelStyle', style: 'iconOnly'});
        // Only the wide copy reports its height: the inline one sits in the minimized bar, not over it.
        const {TabAccessoryHeightContext} = await import('./action');
        const measured = vi.fn();
        const layout = (height: number) => ({nativeEvent: {layout: {x: 0, y: 0, width: 300, height}}});
        await render(<TabAccessoryHeightContext.Provider value={measured}>{accessory('inline')}</TabAccessoryHeightContext.Provider>);
        await fireNative(screen.getByTestId('tab-accessory'), 'layout', layout(30));
        expect(measured).not.toHaveBeenCalled();
        await render(<TabAccessoryHeightContext.Provider value={measured}>{accessory('regular')}</TabAccessoryHeightContext.Provider>);
        await fireNative(screen.getByTestId('tab-accessory'), 'layout', layout(48));
        expect(measured).toHaveBeenCalledExactlyOnceWith(48);
        await renderApp(await app({action: {label: 'New', icon: icons.add, items: [{label: 'Document', onPress: vi.fn()}]}}));
        const menu = nodes().find(n => n.type === 'RNSTabsHost')!.props.ios.bottomAccessory as (placement: string) => React.ReactElement;
        await render(menu('regular'));
        expect(nodes().some(n => n.props.label === 'New')).toBe(true);
        // Hidden tabs take the accessory with them, by the prop and by HideTabs.
        const hostAccessory = () => nodes().find(n => n.type === 'RNSTabsHost')!.props.ios.bottomAccessory;
        await renderApp(await app({hidden: true, action: {label: 'New', icon: icons.add, onPress: vi.fn()}}));
        expect(nodes().find(n => n.type === 'RNSTabsHost')!.props.tabBarHidden).toBe(true);
        expect(hostAccessory()).toBeUndefined();
        await renderApp({
          ...(await app({action: {label: 'New', icon: icons.add, onPress: vi.fn()}})),
          index: () => <><HideTabs/><Text>Home screen</Text></>,
        });
        expect(nodes().find(n => n.type === 'RNSTabsHost')!.props.tabBarHidden).toBe(true);
        expect(hostAccessory()).toBeUndefined();
      } finally {
        Object.defineProperty(Platform, 'Version', version);
      }
    });

    it('stands the app\'s toast above the bottom accessory on iOS 26, by its measured height', async () => {
      const version = Object.getOwnPropertyDescriptor(Platform, 'Version')!;
      Object.defineProperty(Platform, 'Version', {configurable: true, get: () => '26.0'});
      const {extendPresetMock} = await import('vitest-native/helpers');
      // The host renders the wide accessory inside the tabs, as react-native-screens does.
      const withAccessory = (props: Record<string, any>) =>
        createElement('RNSTabsHost', props, props.children, props.ios?.bottomAccessory?.('regular'));
      extendPresetMock('react-native-screens', {Tabs: {Host: withAccessory, Screen: el('RNSTabsScreenIOS')}});
      const report = vi.fn();
      try {
        const {Tabs} = await import('.');
        await renderApp({
          ...(await app()),
          _layout: () => (
            <AppToastFloorContext.Provider value={report}>
              <Tabs routes={routes} action={{label: 'New', icon: icons.add, onPress: vi.fn()}}/>
            </AppToastFloorContext.Provider>
          ),
        });
        expect(report).toHaveBeenLastCalledWith(inset.bottomTab);
        // UIKit sizes the accessory's content; the action fills it.
        await fireNative(screen.getByTestId('tab-accessory'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 300, height: 48}}});
        expect(report).toHaveBeenLastCalledWith(inset.bottomTab + 48);
      } finally {
        extendPresetMock('react-native-screens', {Tabs: {Host: el('RNSTabsHost'), Screen: el('RNSTabsScreenIOS')}});
        Object.defineProperty(Platform, 'Version', version);
      }
    });
  }

  it('hides the native tab bar while a focused screen renders HideTabs', async () => {
    await renderApp({
      ...(await app()),
      index: () => (
        <>
          <HideTabs/>
          <Text>Home screen</Text>
        </>
      ),
    });
    expect(nodes().find(n => n.type === 'RNSTabsHost')!.props.tabBarHidden).toBe(true);
  });

  it('passes hidden to the native tab bar', async () => {
    await renderApp(await app({hidden: true}));
    expect(triggers()).toHaveLength(2);
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(nodes().find(n => n.type === 'RNSTabsHost')!.props.tabBarHidden).toBe(true);
  });

  it('hides the native tab bar on the routes a function of the route names', async () => {
    await renderApp(await app({hidden: ({pathname}: {pathname: string}) => pathname === '/settings'}));
    const tabBarHidden = () => nodes().find(n => n.type === 'RNSTabsHost')!.props.tabBarHidden;
    expect(tabBarHidden()).toBe(false);
    await act(async () => router.navigate('/settings'));
    expect(screen.getByText('Settings screen')).toBeOnTheScreen();
    expect(tabBarHidden()).toBe(true);
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
});
