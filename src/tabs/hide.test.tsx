import type {ReactElement} from 'react';
import type {TabBarProps, TabRoute} from './types';
import {useEffect} from 'react';
import {Platform, Text} from 'react-native';
import {ExpoRoot, Slot} from 'expo-router';
import {renderApp} from 'expo-vitest/router';
import {HideTabs, HideTabsContext, useHiddenTabs} from './hide';

/** What the tabs decided on each render they committed, the first one first. */
const seen: boolean[] = [];

/** A layout that hides its tabs as `Tabs` does, and says what it decided. */
function Layout({hidden}: {hidden?: TabBarProps['hidden']}) {
  const tabs = useHiddenTabs(hidden);
  useEffect(() => {
    seen.push(tabs.hidden);
  });
  return (
    <HideTabsContext.Provider value={tabs.hider}>
      <Slot/>
    </HideTabsContext.Provider>
  );
}

describe(`useHiddenTabs (${Platform.OS})`, () => {
  beforeEach(() => {
    seen.length = 0;
  });

  it('decides a hidden route in the render itself, from the path and the segments', async () => {
    await renderApp({
      _layout: () => <Layout hidden={({pathname, segments}) => pathname === '/doc' && segments.at(-1) === 'doc'}/>,
      index: () => <Text>Home</Text>,
      doc: () => <Text>Doc</Text>,
    }, '/doc');
    // The first render a static page would draw already has the tabs hidden.
    expect(seen[0]).toBe(true);
  });

  it('leaves HideTabs to hide them after the first render, once the screen has mounted', async () => {
    await renderApp({
      _layout: () => <Layout/>,
      index: () => <Text>Home</Text>,
      doc: () => (
        <>
          <HideTabs/>
          <Text>Doc</Text>
        </>
      ),
    }, '/doc');
    expect(seen[0]).toBe(false);
    expect(seen.at(-1)).toBe(true);
  });

  if (Platform.OS === 'web') {
    it('draws a static page without the tabs its route hides, where HideTabs leaves them drawn', async () => {
      // The one function of `react-dom/server` this calls: the repository carries no types for react-dom.
      const {renderToString} = (await import('react-dom/server' as string)) as {renderToString: (element: ReactElement) => string};
      const {Tabs} = await import('.');
      const routes: TabRoute[] = [
        {href: '/', name: 'index', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
        {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
      ];
      /** The page a static export writes for `/settings`. */
      const page = (hidden: TabBarProps['hidden'], hide: boolean) => renderToString(
        <ExpoRoot
          location="/settings"
          context={inMemoryContext({
            _layout: () => <Tabs routes={routes} hidden={hidden}/>,
            index: () => <Text>Home screen</Text>,
            settings: () => (
              <>
                <HideTabs hidden={hide}/>
                <Text>Settings screen</Text>
              </>
            ),
          })}
        />,
      );
      const byRoute = page(({pathname}) => pathname === '/settings', false);
      expect(byRoute).toContain('Settings screen');
      expect(byRoute).toBe(page(true, false));
      expect(byRoute).not.toBe(page(false, false));
      // HideTabs acts in an effect, which a static render never runs.
      expect(page(false, true)).toBe(page(false, false));
    });
  }
});

/** A `require.context` over `routes`, the shape `expo-vitest/router` hands `ExpoRoot`. */
function inMemoryContext(routes: Record<string, () => React.ReactNode>) {
  return Object.assign((id: string) => ({default: routes[id.replace(/^\.\//, '').replace(/\.\w*$/, '')]}), {
    resolve: (key: string) => key,
    id: '0',
    keys: () => Object.keys(routes).map(key => `./${key}.js`),
  }) as unknown as Parameters<typeof ExpoRoot>[0]['context'];
}
