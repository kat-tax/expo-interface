import type {TabRoute} from './types';
import {Platform, StyleSheet, Text} from 'react-native';
import {act, fireEvent, screen as dom, waitFor} from '@testing-library/react';
import {fireEvent as fireNative, render, screen} from '@testing-library/react-native';
import Constants from 'expo-constants';
import {router} from 'expo-router';
import * as icons from '../__stories__/icons';
import {HeaderAccessory} from '../header-accessory';
import {HeaderAction} from '../header-action';
import {HeaderMenu} from '../header-menu';
import {HeaderSearch} from '../header-search';
import {HideTabs} from './hide';
import {Screen} from '../screen';
import {colors, inset, spacing, theme} from '../theme';
import {host, modifier, nodes} from 'expo-vitest/native';
import {visibleText} from '../a11y/roving';
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

/**
 * A tab holding a `TabStack`, whose screens hand their header to the bar;
 * `control` is rendered in the home screen's content, `pushed` in the detail
 * screen's.
 */
const stackApp = async (props: Record<string, any> = {}, control?: React.ReactNode, pushed?: React.ReactNode) => {
  const {Tabs} = await import('.');
  const {TabStack} = await import('../tab-stack');
  const stacked: TabRoute[] = [{...routes[0], href: '/home', name: 'home'}, routes[1]];
  return {
    _layout: () => <Tabs routes={stacked} {...props}/>,
    'home/_layout': () => <TabStack title="Drops" headerRight={() => <Text testID="new">New…</Text>}/>,
    'home/index': () => (control ? (
      <Screen>
        {control}
        <Text testID="kid">Home screen</Text>
      </Screen>
    ) : <Text>Home screen</Text>),
    'home/detail': () => (
      <>
        {pushed}
        <Text>Detail screen</Text>
      </>
    ),
    settings: () => <Text>Settings screen</Text>,
  };
};

describe(`Tabs (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    const appName = String(Constants.expoConfig?.name);

    // `expo-router/ui` reaches the web project through the alias in
    // expo-vitest's web project: its ESM stub over a CJS module yields no named
    // exports once pre-bundled, so the CJS entry is loaded directly.
    describe('web tab bar', () => {
      it('renders a floating bar link per route around the active screen', async () => {
        await renderApp(await app());
        const links = dom.getAllByRole('link');
        expect(links.map(l => l.getAttribute('href'))).toEqual(['/', '/settings']);
        // The visible text: the icon beside a label is a ligature, the glyph's name hidden from the reader.
        expect(links.map(l => visibleText(l))).toEqual(['Home', 'Settings']);
        expect(links[0].querySelector('.ui-symbol')!.textContent).toBe('home');
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

      it('takes a root screen trailing slot but leaves its title to the tab', async () => {
        await renderApp(await stackApp(), '/home');
        const bar = dom.getByTestId('tab-bar');
        // The screen's `headerRight` folds in; there is no second row for it.
        expect(bar.contains(dom.getByTestId('new'))).toBe(true);
        // Its title does not: the tab beside it in the bar already says it, so
        // the logo slot stays the app's.
        expect(dom.queryByText('Drops')).toBeNull();
        expect(bar.contains(dom.getByText(appName))).toBe(true);
        expect(dom.getByText('Home screen')).toBeInTheDocument();
      });

      it('folds a pushed screen header in, title and all', async () => {
        await renderApp(await stackApp(), '/home');
        await act(async () => router.push('/home/detail'));
        const bar = dom.getByTestId('tab-bar');
        // The title takes the app name's place, once, in the bar alone.
        expect(bar.contains(dom.getByText('detail'))).toBe(true);
        expect(dom.getAllByText('detail')).toHaveLength(1);
        expect(dom.queryByText(appName)).toBeNull();
        expect(dom.getByText('Detail screen')).toBeInTheDocument();
      });

      it('lets go of a header when its tab loses focus', async () => {
        await renderApp(await stackApp(), '/home');
        await act(async () => router.push('/home/detail'));
        expect(dom.getByTestId('tab-bar').textContent).toContain('detail');

        // The tab the user leaves does not render again, so a header published
        // on render alone would stay in the bar over the tab they moved to.
        await act(async () => router.push('/settings'));
        expect(dom.getByText('Settings screen')).toBeInTheDocument();
        expect(dom.getByTestId('tab-bar').textContent).not.toContain('detail');
        expect(dom.queryByLabelText('Go back')).toBeNull();
        expect(dom.getByText(appName)).toBeInTheDocument();
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

        // Back on the tab's own screen the bar is the logo's again.
        fireEvent.click(back);
        expect(dom.queryByText('detail')).toBeNull();
        expect(dom.getByText(appName)).toBeInTheDocument();
        expect(dom.getByText('Home screen')).toBeInTheDocument();
      });

      it('keeps the bar as the header while the tabs are hidden', async () => {
        await renderApp(await stackApp({hidden: true}), '/home');
        // Nothing is folded in yet, so `hidden` hides the bar outright.
        expect(getComputedStyle(dom.getByTestId('tab-bar')).display).toBe('none');

        // A pushed screen's header keeps it: the way back is in it.
        await act(async () => router.push('/home/detail'));
        expect(getComputedStyle(dom.getByTestId('tab-bar')).display).not.toBe('none');
        expect(getComputedStyle(dom.getByTestId('tab-bar-tabs')).display).toBe('none');
        expect(dom.getByTestId('tab-bar').contains(dom.getByText('detail'))).toBe(true);
        expect(dom.getByLabelText('Go back')).toBeInTheDocument();
      });

      it('hides the tabs while a focused screen renders HideTabs, and shows them again when it goes', async () => {
        await renderApp(await stackApp({}, undefined, <HideTabs/>), '/home');
        expect(getComputedStyle(dom.getByTestId('tab-bar-tabs')).display).not.toBe('none');
        await act(async () => router.push('/home/detail'));
        // The bar stays as the pushed screen's header, without its tabs.
        expect(getComputedStyle(dom.getByTestId('tab-bar-tabs')).display).toBe('none');
        expect(dom.getByLabelText('Go back')).toBeInTheDocument();
        await act(async () => router.back());
        expect(getComputedStyle(dom.getByTestId('tab-bar-tabs')).display).not.toBe('none');
      });

      it('lets go of the tabs when HideTabs says so', async () => {
        await renderApp(await stackApp({}, <HideTabs hidden={false}/>), '/home');
        expect(getComputedStyle(dom.getByTestId('tab-bar')).display).not.toBe('none');
      });

      it('puts the logo where the back button goes on a screen reached with nothing under it, as a link to the first tab', async () => {
        await renderApp(await stackApp({webIcon: icons.share}, undefined, <HideTabs/>), '/home/detail');
        // Nothing to go back to, but the screen's title, and the bar is kept with the tabs hidden.
        expect(dom.queryByLabelText('Go back')).toBeNull();
        const bar = dom.getByTestId('tab-bar');
        expect(getComputedStyle(bar).display).not.toBe('none');
        expect(bar.contains(dom.getByText('detail'))).toBe(true);
        const home = dom.getByTestId('tab-bar-home');
        expect(home).toHaveAttribute('href', '/home');
        // Named for the tab it leads to.
        expect(home).toHaveAttribute('aria-label', 'Home');
        expect(home.contains(dom.getByTestId('tab-bar-mark'))).toBe(true);
        // It dims while it is held, like the back button.
        fireEvent.mouseDown(home);
        await waitFor(() => expect(getComputedStyle(home).opacity).toBe('0.7'));
        fireEvent.mouseUp(home);
        fireEvent.click(home);
        await waitFor(() => expect(dom.getByText('Home screen')).toBeInTheDocument());
      });

      it('gives a custom logo\'s place to a pushed screen\'s back button', async () => {
        await renderApp(await stackApp({webLogo: <Text testID="logo">Logo</Text>}), '/home');
        expect(dom.getByTestId('logo')).toBeInTheDocument();
        await act(async () => router.push('/home/detail'));
        expect(dom.queryByTestId('logo')).toBeNull();
        expect(dom.getByLabelText('Go back')).toBeInTheDocument();
      });

      it('makes a custom logo the home link on a screen reached with nothing under it', async () => {
        await renderApp(await stackApp({webLogo: <Text testID="logo">Logo</Text>}), '/home/detail');
        expect(dom.getByTestId('tab-bar-home').contains(dom.getByTestId('logo'))).toBe(true);
      });

      it('draws the app\'s name in the home link where there is no mark', async () => {
        await renderApp(await stackApp({webLogo: 'text-only'}), '/home/detail');
        expect(dom.getByTestId('tab-bar-home').textContent).toBe(appName);
      });

      it('folds a screen\'s inline search into the bar as a frameless field beside the logo, and after a pushed screen\'s title', async () => {
        await renderApp(await stackApp({}, <HeaderSearch placement="inline" placeholder="Find a drop"/>, <HeaderSearch placement="inline" placeholder="Find a detail"/>), '/home');
        const input = dom.getByRole('searchbox', {name: 'Find a drop'});
        // In the logo slot, after the app's name and before the actions and the tabs.
        expect(dom.getByTestId('tab-bar-logo').contains(input)).toBe(true);
        expect(dom.getByText(appName).compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(input.compareDocumentPosition(dom.getByTestId('new')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(input.compareDocumentPosition(dom.getByTestId('tab-bar-tabs')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        // Frameless: not `SearchField`'s box.
        expect(input).toHaveClass('ui-header-search__input');
        expect(dom.queryByTestId('tab-bar-search')).toBeNull();
        // Nothing is under the bar: the screens pay the bar's inset alone.
        expect(getComputedStyle(dom.getByTestId('kid').parentElement!.parentElement!).paddingTop).toBe(`${inset.topBar}px`);
        // The slot grows into the row's spare width, which the field takes before the gap does.
        const slot = getComputedStyle(dom.getByTestId('tab-bar-logo'));
        expect(slot.flexGrow).toBe('1');
        expect(slot.flexShrink).toBe('1');

        // A pushed screen's search follows its title.
        await act(async () => router.push('/home/detail'));
        const pushed = dom.getByRole('searchbox', {name: 'Find a detail'});
        expect(dom.getByTestId('tab-bar-logo').contains(pushed)).toBe(true);
        expect(dom.getByText('detail').compareDocumentPosition(pushed) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });

      it('folds an automatic search in as the inline field, whatever the width', async () => {
        await renderApp(await stackApp({}, <HeaderSearch placeholder="Find a drop"/>), '/home');
        expect(dom.getByTestId('tab-bar-logo').contains(dom.getByRole('searchbox', {name: 'Find a drop'}))).toBe(true);
        expect(dom.queryByTestId('tab-bar-search')).toBeNull();
      });

      it('keeps an action\'s magnifier among the actions', async () => {
        await renderApp(await stackApp({}, <HeaderSearch placement="action" placeholder="Find a drop"/>), '/home');
        const magnifier = dom.getByRole('button', {name: 'Find a drop'});
        expect(dom.getByTestId('tab-bar').contains(magnifier)).toBe(true);
        expect(dom.getByTestId('tab-bar-logo').contains(magnifier)).toBe(false);
        expect(dom.getByTestId('new').compareDocumentPosition(magnifier) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });

      it('puts a screen\'s stacked search in a second pill under the bar, which the screens pay for', async () => {
        await renderApp(await stackApp({}, <HeaderSearch placement="stacked" placeholder="Find a drop"/>), '/home');
        const row = dom.getByTestId('tab-bar-search');
        const input = dom.getByRole('searchbox', {name: 'Find a drop'});
        expect(row.contains(input)).toBe(true);
        expect(dom.getByTestId('tab-bar').contains(input)).toBe(false);
        // Under the bar, in its block, in its solid fill.
        expect(dom.getByTestId('tab-bar').compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(getComputedStyle(row).backgroundColor).toBe(theme.backgroundElement);
        // The screen pads the row's height on top of the bar's inset.
        expect(getComputedStyle(dom.getByTestId('kid').parentElement!.parentElement!).paddingTop).toBe(`${inset.topBar + 56}px`);
        // A pushed screen without a search takes the row away.
        await act(async () => router.push('/home/detail'));
        expect(dom.queryByTestId('tab-bar-search')).toBeNull();
      });

      it('hands the search row the bar\'s material', async () => {
        await renderApp(await stackApp({webMaterial: 'regular'}, <HeaderSearch placement="stacked"/>), '/home');
        const row = dom.getByTestId('tab-bar-search');
        expect(row).toHaveAttribute('data-material', 'regular');
        expect(row).toHaveAttribute('data-material-fill', 'element');
        expect(getComputedStyle(row).backgroundColor).not.toBe(theme.backgroundElement);
      });

      describe('a header accessory', () => {
        /** The accessory row's height, as the browser would lay it out. */
        let rowHeight = 40;
        let offsetHeight: ReturnType<typeof vi.spyOn>;
        const Observer = globalThis.ResizeObserver;

        beforeEach(() => {
          rowHeight = 40;
          offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
            return this.getAttribute('data-testid') === 'tab-bar-accessory' ? rowHeight : 0;
          });
        });
        afterEach(() => {
          offsetHeight.mockRestore();
          globalThis.ResizeObserver = Observer;
        });

        const strip = <HeaderAccessory><Text testID="strip">Strip</Text></HeaderAccessory>;
        const paddingTop = () => getComputedStyle(dom.getByTestId('kid').parentElement!.parentElement!).paddingTop;

        it('puts the row in a pill under the bar, under a stacked search, and the screens pay its height', async () => {
          await renderApp(await stackApp({}, <><HeaderSearch placement="stacked" placeholder="Find a drop"/>{strip}</>), '/home');
          const row = dom.getByTestId('tab-bar-accessory');
          expect(row.contains(dom.getByTestId('strip'))).toBe(true);
          expect(dom.getByTestId('tab-bar').contains(row)).toBe(false);
          expect(dom.getByTestId('tab-bar-search').compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
          expect(getComputedStyle(row).backgroundColor).toBe(theme.backgroundElement);
          // The bar, the search row, and the accessory with its gap.
          expect(paddingTop()).toBe(`${inset.topBar + 56 + 40 + spacing.two}px`);
          // A pushed screen without one takes the row away, and its height with it.
          await act(async () => router.push('/home/detail'));
          expect(dom.queryByTestId('tab-bar-accessory')).toBeNull();
        });

        it('follows the row as its content resizes it', async () => {
          const observers: ResizeObserverCallback[] = [];
          globalThis.ResizeObserver = class {
            constructor(callback: ResizeObserverCallback) {
              observers.push(callback);
            }
            observe() {}
            unobserve() {}
            disconnect() {}
          } as unknown as typeof ResizeObserver;
          await renderApp(await stackApp({}, strip), '/home');
          expect(paddingTop()).toBe(`${inset.topBar + 40 + spacing.two}px`);
          rowHeight = 64;
          await act(async () => {
            for (const observer of observers) observer([], {} as ResizeObserver);
          });
          expect(paddingTop()).toBe(`${inset.topBar + 64 + spacing.two}px`);
        });

        it('hands the row the bar\'s material', async () => {
          await renderApp(await stackApp({webMaterial: 'regular'}, strip), '/home');
          const row = dom.getByTestId('tab-bar-accessory');
          expect(row).toHaveAttribute('data-material', 'regular');
          expect(row).toHaveAttribute('data-material-edge', 'all');
        });

        it('is the header\'s own row under its title when the fold is off', async () => {
          await renderApp(await stackApp({webFoldHeader: false}, strip), '/home');
          expect(dom.queryByTestId('tab-bar-accessory')).toBeNull();
          const title = dom.getByText('Drops');
          expect(title.compareDocumentPosition(dom.getByTestId('strip')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
          expect(dom.getByTestId('tab-bar').contains(dom.getByTestId('strip'))).toBe(false);
        });
      });

      it('leaves the header to the screen when the fold is off', async () => {
        await renderApp(await stackApp({webFoldHeader: false}), '/home');
        expect(dom.getByTestId('tab-bar').contains(dom.getByText('Drops'))).toBe(false);
        expect(dom.getByText(appName)).toBeInTheDocument();
      });

      it('draws a route\'s icon from a token, filled where it asks, and a mark from one too', async () => {
        await renderApp(await app({
          routes: [{...routes[0], icon: icons.starFilled}, {...routes[1], icon: icons.settings}],
          webLogo: 'icon-only',
          webIcon: icons.share,
        }));
        const [home, settings] = dom.getAllByRole('link');
        expect(home.querySelector('.ui-symbol')!.classList.contains('ui-symbol--filled')).toBe(true);
        expect(home.querySelector('.ui-symbol')!.textContent).toBe('star');
        expect(settings.querySelector('.ui-symbol')!.textContent).toBe('settings');
        // The app's mark as the kit's glyph in the label color, no image.
        expect(dom.getByTestId('tab-bar-mark').textContent).toBe('share');
        expect(document.querySelector('img')).toBeNull();
      });

      it('shows a badge beside a tab\'s label, and none for nothing', async () => {
        await renderApp(await app({routes: [{...routes[0], badge: 3}, {...routes[1], badge: 0}]}));
        expect(dom.getAllByTestId('tab-badge')).toHaveLength(1);
        expect(dom.getByTestId('tab-badge').textContent).toBe('3');
      });

      it('caps a count at badgeMax, as a Badge does', async () => {
        await renderApp(await app({routes: [{...routes[0], badge: 120}, routes[1]], badgeMax: 99}));
        expect(dom.getByTestId('tab-badge').textContent).toBe('99+');
      });

      it('draws the app\'s action among the bar\'s actions as a button', async () => {
        const onPress = vi.fn();
        await renderApp(await app({action: {label: 'New', icon: icons.add, onPress}}));
        const button = dom.getByTestId('tab-action');
        expect(dom.getByTestId('tab-bar').contains(button)).toBe(true);
        fireEvent.click(button);
        expect(onPress).toHaveBeenCalledTimes(1);
      });

      it('draws an action with entries as a menu', async () => {
        await renderApp(await app({action: {label: 'New', icon: icons.add, items: [{label: 'Document', onPress: () => {}}]}}));
        expect(dom.getByRole('menuitem', {name: 'Document', hidden: true})).toBeInTheDocument();
      });

      it('does nothing for an action with nothing to run', async () => {
        await renderApp(await app({action: {label: 'New', icon: icons.add}}));
        expect(() => fireEvent.click(dom.getByTestId('tab-action'))).not.toThrow();
      });

      it('keeps the app\'s action beside what a screen folds in', async () => {
        await renderApp(await stackApp({action: {label: 'New', icon: icons.add, onPress: () => {}}}), '/home');
        expect(dom.getByTestId('new').compareDocumentPosition(dom.getByTestId('tab-action')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

      it('paints a solid fill by default', async () => {
        await renderApp(await app());
        const row = dom.getByTestId('tab-bar-row');
        expect(getComputedStyle(row).backgroundColor).toBe(theme.backgroundElement);
        expect(row).not.toHaveAttribute('data-material');
      });

      it('hands the row to the stylesheet for a material', async () => {
        // The material is the sheet's scale, drawn by `material.css` from
        // these attributes; the row's own fill stays off so it cannot paint
        // over the blur.
        await renderApp(await app({webMaterial: 'regular'}));
        const row = dom.getByTestId('tab-bar-row');
        expect(row).toHaveAttribute('data-material', 'regular');
        expect(row).toHaveAttribute('data-material-fill', 'element');
        expect(row).toHaveAttribute('data-material-edge', 'all');
        expect(getComputedStyle(row).backgroundColor).not.toBe(theme.backgroundElement);
      });

      describe('in a window narrower than its labels', () => {
        /** The row's widths as the browser would report them: what it has, and what its content needs. */
        const widths = {client: 0, scroll: 0};
        /** The logo slot's, the same way; a slot that fits reports no more than it has. */
        const slotWidths = {client: 0, scroll: 0};
        /** The resize observers the bar makes, to resize it from the test. */
        const observers: ResizeObserverCallback[] = [];
        const Observer = globalThis.ResizeObserver;
        let clientWidth: ReturnType<typeof vi.spyOn>;
        let scrollWidth: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
          // jsdom lays nothing out: the widths come from here, the slot's for the slot and the row's for every other element.
          const measured = (element: HTMLElement) => (element.getAttribute('data-testid') === 'tab-bar-logo' ? slotWidths : widths);
          clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return measured(this).client;
          });
          scrollWidth = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return measured(this).scroll;
          });
          slotWidths.client = 0;
          slotWidths.scroll = 0;
          observers.length = 0;
          globalThis.ResizeObserver = class {
            constructor(callback: ResizeObserverCallback) {
              observers.push(callback);
            }
            observe() {}
            unobserve() {}
            disconnect() {}
          } as unknown as typeof ResizeObserver;
        });
        afterEach(() => {
          clientWidth.mockRestore();
          scrollWidth.mockRestore();
          globalThis.ResizeObserver = Observer;
        });

        const resize = async (client: number) => {
          widths.client = client;
          await act(async () => {
            for (const observer of observers) observer([], {} as ResizeObserver);
          });
        };

        it('drops the labels for the icons alone, and brings them back once there is room', async () => {
          // A phone's width, with a row that needs more.
          widths.client = 390;
          widths.scroll = 456;
          await renderApp(await app());
          const [home, settings] = dom.getAllByRole('link');
          // The names stay as the links' accessible names.
          expect(home).toHaveAttribute('aria-label', 'Home');
          expect(settings).toHaveAttribute('aria-label', 'Settings');
          expect(home.querySelector('span:not(.ui-symbol)')).toBeNull();
          expect(dom.getByText('Home screen')).toBeInTheDocument();

          // Wide enough for what the labelled row needed: the labels return.
          widths.scroll = 390;
          await resize(456);
          expect(visibleText(home)).toBe('Home');
          expect(home).not.toHaveAttribute('aria-label');
        });

        it('drops the labels when the logo slot is squeezed below its floor, and a search beside the mark takes the name\'s room', async () => {
          // The row reads as fitting; the slot does not: its mark, name and field need 60 more.
          widths.client = 600;
          widths.scroll = 600;
          slotWidths.client = 200;
          slotWidths.scroll = 260;
          const placeholder = (state: {size: 'full' | 'short'}) => (state.size === 'short' ? 'Find' : 'Find a drop');
          await renderApp(await stackApp({webIcon: {uri: 'https://example.com/icon.png'}}, <HeaderSearch placement="inline" placeholder={placeholder}/>), '/home');
          const [home] = dom.getAllByRole('link');
          expect(home).toHaveAttribute('aria-label', 'Home');
          expect(dom.queryByText(appName)).toBeNull();
          expect(dom.getByRole('img')).toBeInTheDocument();
          const field = dom.getByRole('searchbox', {name: 'Find a drop'});
          expect(dom.getByTestId('tab-bar-logo').contains(field)).toBe(true);
          // The narrow bar's field shows the short placeholder; its name stays the full one.
          expect(field).toHaveAttribute('placeholder', 'Find');

          // The row's width plus the slot's deficit is what the labels wait for.
          slotWidths.client = 260;
          await resize(659);
          expect(home).toHaveAttribute('aria-label', 'Home');
          await resize(660);
          expect(home).not.toHaveAttribute('aria-label');
          expect(dom.getByText(appName)).toBeInTheDocument();
          expect(field).toHaveAttribute('placeholder', 'Find a drop');
        });

        it('keeps the name beside the mark in a narrow bar without a search', async () => {
          widths.client = 390;
          widths.scroll = 456;
          await renderApp(await app({webIcon: {uri: 'https://example.com/icon.png'}}));
          expect(dom.getAllByRole('link')[0]).toHaveAttribute('aria-label', 'Home');
          expect(dom.getByText(appName)).toBeInTheDocument();
        });

        it('leaves the labels alone while the row fits, and clips rather than scrolls', async () => {
          widths.client = 600;
          widths.scroll = 456;
          await renderApp(await app());
          const [home] = dom.getAllByRole('link');
          expect(visibleText(home)).toBe('Home');
          await resize(700);
          expect(visibleText(home)).toBe('Home');
          // What the row cannot hold is cut, never a sideways scroll of the page.
          const style = getComputedStyle(dom.getByTestId('tab-bar-row'));
          expect(style.overflowX).toBe('hidden');
          expect(style.minWidth).toBe('0px');
          expect(style.flexShrink).toBe('1');
        });

        it('shows a header control by its icon alone, and keeps one without an icon whole', async () => {
          widths.client = 390;
          widths.scroll = 456;
          await renderApp(await app({
            webActions: (
              <>
                <HeaderMenu label="More" icon={icons.add} items={[{label: 'New'}]}/>
                <HeaderAction label="Share" icon={icons.share} onPress={() => {}}/>
                <HeaderAction label="Save" onPress={() => {}}/>
              </>
            ),
          }));
          expect(dom.getByRole('button', {name: 'More'})).toHaveClass('ui-button--icon-only');
          expect(dom.getByRole('button', {name: 'Share'})).toHaveClass('ui-button--icon-only');
          expect(dom.getByRole('button', {name: 'Save'})).not.toHaveClass('ui-button--icon-only');
          expect(dom.getByRole('button', {name: 'Save'}).textContent).toBe('Save');
        });

        it('reads the row once, without an observer, where there is none', async () => {
          // A static render: nothing to resize, and no observer to make.
          globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
          widths.client = 390;
          widths.scroll = 456;
          await renderApp(await app());
          expect(observers).toHaveLength(0);
          expect(dom.getAllByRole('link')[0]).toHaveAttribute('aria-label', 'Home');
        });
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
          index: () => <Screen fab={<Text testID="own">Own</Text>}><Text>Home screen</Text></Screen>,
        });
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
        // Hidden tabs take their action with them.
        await renderApp(await app({hidden: true, action: {label: 'New', icon: icons.add, onPress}}));
        expect(screen.queryByTestId('tab-action-slot')).toBeNull();
      } finally {
        Object.defineProperty(Platform, 'Version', version);
        await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
      }
    });

    if (isIOS) {
      it('puts the app\'s action in the tab bar\'s bottom accessory on iOS 26, its icon alone where the accessory is inline', async () => {
        const version = Object.getOwnPropertyDescriptor(Platform, 'Version')!;
        Object.defineProperty(Platform, 'Version', {configurable: true, get: () => '26.0'});
        try {
          await renderApp(await app({action: {label: 'New', icon: icons.add, onPress: vi.fn()}}));
          expect(screen.queryByTestId('tab-action-slot')).toBeNull();
          const accessory = nodes().find(n => n.type === 'RNSTabsHost')!.props.ios.bottomAccessory as (placement: string) => React.ReactElement;
          await render(accessory('regular'));
          expect(modifier(host(p => p.label === 'New').props, 'labelStyle')).toBeUndefined();
          await render(accessory('inline'));
          expect(modifier(host(p => p.label === 'New').props, 'labelStyle')).toEqual({$type: 'labelStyle', style: 'iconOnly'});
          await renderApp(await app({action: {label: 'New', icon: icons.add, items: [{label: 'Document', onPress: vi.fn()}]}}));
          const menu = nodes().find(n => n.type === 'RNSTabsHost')!.props.ios.bottomAccessory as (placement: string) => React.ReactElement;
          await render(menu('regular'));
          expect(nodes().some(n => n.props.label === 'New')).toBe(true);
        } finally {
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
