import type {TabRoute} from '../tabs/types';
import {act, fireEvent, screen} from '@testing-library/react-native';
import {Animated, Text} from 'react-native';
import {router} from 'expo-router';
import {renderApp} from 'expo-vitest/router';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {TabStack} from '../tab-stack';
import {Tabs} from '../tabs';
import {Screen} from '../screen';
import {inFront, Stack} from './stack.windows';

/** The app config `expo-constants` reports, as each test sets it. */
const constants = vi.hoisted(() => ({config: null as {name?: string} | null}));
vi.mock('expo-constants', () => ({
  default: {
    get expoConfig() {
      return constants.config;
    },
  },
}));

/** The runtime's window module, as its install registers it — or none, as in an app without the runtime. */
const runtime = vi.hoisted(() => ({module: null as {setWindowTitle(title: string): void} | null}));
vi.mock('expo-modules-core', async importOriginal => ({
  ...(await importOriginal<typeof import('expo-modules-core')>()),
  requireOptionalNativeModule: (name: string) => (name === 'ExpoWindows' ? runtime.module : null),
}));

const app = (options: Record<string, unknown> = {}) => ({
  _layout: () => (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{title: 'Drops', headerRight: () => <Text testID="new">New…</Text>}}/>
    </Stack>
  ),
  index: () => <Screen><Text>Home screen</Text></Screen>,
  detail: () => (
    <>
      <Stack.Screen options={{headerTitle: 'A drop'}}/>
      <Text>Detail screen</Text>
    </>
  ),
  plain: () => <Text>Plain screen</Text>,
});

describe('Stack (windows)', () => {
  it('draws a header row with the screen title and trailing slot over the focused screen', async () => {
    await renderApp(app());
    expect(screen.getByText('Drops')).toBeOnTheScreen();
    expect(screen.getByTestId('new')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Go back')).toBeNull();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('pushes a screen with its own title and a back button, and pops from it', async () => {
    await renderApp(app());
    await act(async () => router.push('/detail'));
    expect(screen.getByText('A drop')).toBeOnTheScreen();
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    expect(screen.queryByText('Home screen')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.getByText('Drops')).toBeOnTheScreen();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('titles a screen without options after its route', async () => {
    await renderApp(app(), '/plain');
    expect(screen.getByText('plain')).toBeOnTheScreen();
    expect(screen.getByText('Plain screen')).toBeOnTheScreen();
  });

  it('hides the header on request', async () => {
    await renderApp(app({headerShown: false}));
    expect(screen.queryByText('Drops')).toBeNull();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });
});

describe('TabStack (windows)', () => {
  it('is the kit stack with the tab root titled and its trailing slot filled', async () => {
    await renderApp({
      _layout: () => <TabStack title="Documents" headerRight={() => <Text testID="menu">Menu</Text>}/>,
      index: () => <Screen><Text>Documents screen</Text></Screen>,
    });
    expect(screen.getByText('Documents')).toBeOnTheScreen();
    expect(screen.getByTestId('menu')).toBeOnTheScreen();
    expect(screen.getByText('Documents screen')).toBeOnTheScreen();
    expect(() => island('ExpoInterfaceNavigationView')).toThrow();
  });
});

describe('Stack modals (windows)', () => {
  const modalApp = () => ({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={{title: 'Drops'}}/>
        <Stack.Screen name="edit" options={{presentation: 'modal', title: 'Edit drop'}}/>
        <Stack.Screen name="picker" options={{presentation: 'transparentModal'}}/>
        <Stack.Screen name="quiet" options={{presentation: 'formSheet', headerShown: false}}/>
      </Stack>
    ),
    index: () => <Screen><Text>Home screen</Text></Screen>,
    edit: () => <Text>Edit form</Text>,
    picker: () => <Text>Picker over</Text>,
    quiet: () => <Text>Quiet form</Text>,
  });

  it('presents a modal route in a card over the screen below, with its own header, and dismisses it', async () => {
    await renderApp(modalApp());
    await act(async () => router.push('/edit'));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(screen.getByText('Edit form')).toBeOnTheScreen();
    expect(screen.getByText('Edit drop')).toBeOnTheScreen();
    expect(screen.getByTestId('modal-edit')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Edit form')).toBeNull();
    await act(async () => router.push('/edit'));
    await fireEvent(screen.getByTestId('windows-stack'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(screen.queryByText('Edit form')).toBeNull();
    await act(async () => router.push('/edit'));
    await fireEvent.press(screen.getAllByLabelText('Go back')[0]);
    expect(screen.queryByText('Edit form')).toBeNull();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('lays a transparent modal over the window, stacks a second modal, and hides a header on request', async () => {
    await renderApp(modalApp());
    await act(async () => router.push('/picker'));
    expect(screen.getByText('Picker over')).toBeOnTheScreen();
    expect(screen.getByTestId('modal-picker').queryAll(node => node.props.accessibilityLabel === 'Dismiss')).toHaveLength(0);
    await act(async () => router.push('/quiet'));
    expect(screen.getByText('Picker over')).toBeOnTheScreen();
    expect(screen.getByText('Quiet form')).toBeOnTheScreen();
    expect(screen.queryByText('quiet')).toBeNull();
    // Only the topmost modal dismisses; the smoke belongs to it.
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Quiet form')).toBeNull();
    expect(screen.getByText('Picker over')).toBeOnTheScreen();
  });

  it('pops on Alt+Left, the keyboard back keys and the mouse back button, and never at the root', async () => {
    await renderApp(app());
    const root = screen.getByTestId('windows-stack');
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: true}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await act(async () => router.push('/detail'));
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: false}});
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: true}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await act(async () => router.push('/detail'));
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'BrowserBack', altKey: false}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await act(async () => router.push('/detail'));
    await fireEvent(root, 'pointerDown', {nativeEvent: {button: 0}});
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    await fireEvent(root, 'pointerDown', {nativeEvent: {button: 3}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await fireEvent(root, 'pointerDown', {nativeEvent: {button: 3}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });
});

describe('Stack header options and motion (windows)', () => {
  it('draws headerLeft in place of the back button, hides the back button on request, and takes a title node', async () => {
    await renderApp({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={{title: 'Drops', headerLeft: () => <Text testID="menu-button">Menu</Text>}}/>
          <Stack.Screen name="detail" options={{headerBackVisible: false, headerTitle: ({children}: {children: string}) => <Text testID="custom-title">{children.toUpperCase()}</Text>}}/>
        </Stack>
      ),
      index: () => <Text>Home screen</Text>,
      detail: () => <Text>Detail screen</Text>,
    });
    expect(screen.getByTestId('menu-button')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Go back')).toBeNull();
    await act(async () => router.push('/detail'));
    expect(screen.getByTestId('custom-title')).toHaveTextContent('DETAIL');
    expect(screen.queryByText('detail')).toBeNull();
    expect(screen.queryByLabelText('Go back')).toBeNull();
    // The keys still pop.
    await fireEvent(screen.getByTestId('windows-stack'), 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: true}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('plays the entrance on a push and a modal, and not for a screen that asks for none', async () => {
    const start = vi.fn();
    const timing = vi.spyOn(Animated, 'timing').mockReturnValue({start} as never);
    await renderApp({
      _layout: () => (
        <Stack>
          <Stack.Screen name="index" options={{title: 'Drops'}}/>
          <Stack.Screen name="still" options={{animation: 'none'}}/>
          <Stack.Screen name="edit" options={{presentation: 'modal', title: 'Edit drop'}}/>
        </Stack>
      ),
      index: () => <Text>Home screen</Text>,
      detail: () => <Text>Detail screen</Text>,
      still: () => <Text>Still screen</Text>,
      edit: () => <Text>Edit form</Text>,
    });
    expect(timing).not.toHaveBeenCalled();
    await act(async () => router.push('/detail'));
    expect(timing).toHaveBeenCalledTimes(1);
    await act(async () => router.push('/still'));
    expect(timing).toHaveBeenCalledTimes(1);
    await act(async () => router.push('/edit'));
    expect(timing).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Edit form')).toBeOnTheScreen();
  });
});

describe('Stack window title (windows)', () => {
  const tabs: TabRoute[] = [{href: '/', name: '(home)', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}}];
  const tabbedApp = () => ({
    _layout: () => (
      <Stack>
        <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
        <Stack.Screen name="detail" options={{title: 'A drop'}}/>
        <Stack.Screen name="edit" options={{title: 'Edit drop', presentation: 'modal'}}/>
      </Stack>
    ),
    '(tabs)/_layout': () => <Tabs routes={tabs}/>,
    '(tabs)/(home)/_layout': () => <TabStack title="Documents"/>,
    '(tabs)/(home)/index': () => <Text>Documents screen</Text>,
    detail: () => <Text>Detail screen</Text>,
    edit: () => <Text>Edit form</Text>,
  });

  it('names the window after the focused screen of the innermost focused stack, with the app\'s name', async () => {
    const setWindowTitle = vi.fn();
    runtime.module = {setWindowTitle};
    constants.config = {name: 'Files'};
    try {
      await renderApp(tabbedApp());
      expect(setWindowTitle).toHaveBeenLastCalledWith('Documents – Files');
      await act(async () => router.push('/detail'));
      expect(setWindowTitle).toHaveBeenLastCalledWith('A drop – Files');
      await act(async () => router.back());
      expect(setWindowTitle).toHaveBeenLastCalledWith('Documents – Files');
      // A modal over the tabs is in front of the tab's stack; dismissed, the tab's screen names the window again.
      await act(async () => router.push('/edit'));
      expect(setWindowTitle).toHaveBeenLastCalledWith('Edit drop – Files');
      await act(async () => router.back());
      expect(setWindowTitle).toHaveBeenLastCalledWith('Documents – Files');
    } finally {
      runtime.module = null;
    }
  });

  it('puts a modal before a card, the innermost stack before an outer one, and the later mounted before the earlier', () => {
    const card = {depth: 1, order: 0, title: 'Card', modal: false};
    const modal = {depth: 1, order: 1, title: 'Modal', modal: true};
    const nested = {depth: 2, order: 2, title: 'Nested', modal: false};
    const later = {depth: 2, order: 3, title: 'Later', modal: false};
    expect(inFront(modal, nested)).toBe(true);
    expect(inFront(nested, modal)).toBe(false);
    expect(inFront(nested, card)).toBe(true);
    expect(inFront(card, nested)).toBe(false);
    expect(inFront(later, nested)).toBe(true);
    expect(inFront(nested, later)).toBe(false);
  });

  it('uses the title alone when it is the app\'s name, or there is no app name', async () => {
    const setWindowTitle = vi.fn();
    runtime.module = {setWindowTitle};
    try {
      constants.config = {name: 'Drops'};
      await renderApp(app());
      expect(setWindowTitle).toHaveBeenLastCalledWith('Drops');
      constants.config = null;
      await act(async () => router.push('/detail'));
      expect(setWindowTitle).toHaveBeenLastCalledWith('A drop');
    } finally {
      runtime.module = null;
    }
  });
});

describe('Stack over Tabs (windows)', () => {
  const NAV = 'ExpoInterfaceNavigationView';
  const tabs: TabRoute[] = [
    {href: '/', name: '(home)', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
    {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
  ];
  const framedApp = (tabProps: Record<string, unknown> = {}, detail: Record<string, unknown> = {}) => ({
    _layout: () => (
      <Stack>
        <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
        <Stack.Screen name="detail" options={{title: 'A drop', ...detail}}/>
        <Stack.Screen name="edit" options={{title: 'Edit drop', presentation: 'modal'}}/>
      </Stack>
    ),
    '(tabs)/_layout': () => <Tabs routes={tabs} {...tabProps}/>,
    '(tabs)/(home)/_layout': () => <TabStack title="Documents"/>,
    '(tabs)/(home)/index': () => <Text>Documents screen</Text>,
    '(tabs)/(home)/nested': () => (
      <>
        <Stack.Screen options={{title: 'Nested'}}/>
        <Text>Nested screen</Text>
      </>
    ),
    '(tabs)/settings': () => <Text>Settings screen</Text>,
    detail: () => <Text>Detail screen</Text>,
    edit: () => <Text>Edit form</Text>,
  });

  it('keeps the pane as the frame under a pushed card, lights its back button, and pops from it', async () => {
    await renderApp(framedApp());
    expect(island(NAV).props.backButton).toBe('disabled');
    await act(async () => router.push('/detail'));
    // The tabs are still drawn; the card is in their content, with its title and no drawn back button.
    const bar = island(NAV);
    expect(bar.props.backButton).toBe('enabled');
    expect(screen.getByTestId('card-detail')).toBeOnTheScreen();
    expect(screen.getByText('A drop')).toBeOnTheScreen();
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    expect(screen.queryByText('Documents screen')).toBeNull();
    expect(screen.queryByLabelText('Go back')).toBeNull();
    await fireIsland(bar, 'backRequested');
    expect(screen.getByText('Documents screen')).toBeOnTheScreen();
    expect(screen.queryByText('Detail screen')).toBeNull();
    expect(island(NAV).props.backButton).toBe('disabled');
  });

  it('leaves the drilled-in screens, a modal over them too, when a tab is selected in the pane', async () => {
    await renderApp(framedApp());
    await act(async () => router.push('/detail'));
    await act(async () => router.push('/edit'));
    expect(screen.getByText('Edit form')).toBeOnTheScreen();
    await fireIsland(island(NAV), 'selectionChange', {index: 1});
    expect(screen.getByText('Settings screen')).toBeOnTheScreen();
    expect(screen.queryByText('Detail screen')).toBeNull();
    expect(screen.queryByText('Edit form')).toBeNull();
    // The tab already selected takes the drilled-in screens away as well.
    await act(async () => router.push('/detail'));
    await fireIsland(island(NAV), 'selectionChange', {index: 1});
    expect(screen.getByText('Settings screen')).toBeOnTheScreen();
    expect(screen.queryByText('Detail screen')).toBeNull();
  });

  it('hands a tab\'s own pushed screen to the pane\'s back button, and a modal keeps its dismiss', async () => {
    await renderApp(framedApp());
    await act(async () => router.push('/nested'));
    expect(island(NAV).props.backButton).toBe('enabled');
    expect(screen.getByText('Nested')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Go back')).toBeNull();
    await fireIsland(island(NAV), 'backRequested');
    expect(screen.getByText('Documents screen')).toBeOnTheScreen();
    expect(island(NAV).props.backButton).toBe('disabled');
    // A modal over the tabs is dismissed from its own header; the pane's button is not its way out.
    await act(async () => router.push('/edit'));
    expect(island(NAV).props.backButton).toBe('disabled');
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.queryByText('Edit form')).toBeNull();
  });

  it('is no frame while the tabs are hidden: a card replaces them and draws its back button', async () => {
    await renderApp(framedApp({hidden: true}));
    await act(async () => router.push('/detail'));
    expect(screen.queryByTestId('card-detail')).toBeNull();
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.getByText('Documents screen')).toBeOnTheScreen();
  });

  it('hides a card\'s header on request', async () => {
    await renderApp(framedApp({}, {headerShown: false}));
    await act(async () => router.push('/detail'));
    expect(screen.queryByText('A drop')).toBeNull();
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
  });

  it('tells a card\'s headerLeft there is a way back, though it draws no back button', async () => {
    await renderApp(framedApp({}, {headerLeft: ({canGoBack}: {canGoBack: boolean}) => <Text>{canGoBack ? 'can go back' : 'at the root'}</Text>}));
    await act(async () => router.push('/detail'));
    expect(screen.getByText('can go back')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });
});

describe('Tabs inside a card (windows)', () => {
  const NAV = 'ExpoInterfaceNavigationView';
  const outer: TabRoute[] = [{href: '/', name: '(home)', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}}];
  const inner: TabRoute[] = [{href: '/doc', name: 'pages', label: 'Pages', icon: {ios: 'doc', android: 'description', web: 'description'}}];
  const nestedApp = () => ({
    _layout: () => (
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="(tabs)"/>
        <Stack.Screen name="doc"/>
        <Stack.Screen name="detail" options={{title: 'A drop', headerShown: true}}/>
      </Stack>
    ),
    '(tabs)/_layout': () => <Tabs routes={outer}/>,
    '(tabs)/(home)/_layout': () => <TabStack title="Documents"/>,
    '(tabs)/(home)/index': () => <Text>Documents screen</Text>,
    'doc/_layout': () => <Tabs routes={inner}/>,
    'doc/pages': () => <Text>Pages screen</Text>,
    detail: () => <Text>Detail screen</Text>,
  });

  it('is no frame of its own: a card over it is drawn in the outer tabs, which keep their frame when it goes', async () => {
    await renderApp(nestedApp());
    await act(async () => router.push('/doc'));
    // Both bars are drawn: the outer one as the frame, the inner one inside the card, with no stack to tell of.
    const [outerBar, innerBar] = islands(NAV);
    expect(outerBar.props.backButton).toBe('enabled');
    expect(innerBar.props.backButton).toBe('hidden');
    expect(screen.getByText('Pages screen')).toBeOnTheScreen();
    await act(async () => router.push('/detail'));
    expect(islands(NAV)).toHaveLength(1);
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    expect(screen.queryByText('Pages screen')).toBeNull();
    await act(async () => router.back());
    expect(screen.getByText('Pages screen')).toBeOnTheScreen();
    await act(async () => router.back());
    expect(screen.getByText('Documents screen')).toBeOnTheScreen();
    expect(island(NAV).props.backButton).toBe('disabled');
  });
});
