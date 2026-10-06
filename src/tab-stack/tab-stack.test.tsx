import {Platform, Text} from 'react-native';
import {Stack} from 'expo-router';
import {screen as dom} from '@testing-library/react';
import {renderHook, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {barItems} from '../__stories__/header';
import * as icons from '../__stories__/icons';
import {HeaderAction} from '../header-action';
import {colors, theme} from '../theme';
import {stackHeaders} from 'expo-vitest/native';
import {renderApp} from 'expo-vitest/router';
import {ConstrainedStackHeader} from '../stack-header';
import {HeaderSlotContext, createHeaderSlot} from '../tabs/context';
import {TabStack} from '.';

const app = {
  _layout: () => <TabStack title="Drops"/>,
  index: () => <Text>Home screen</Text>,
};

/** The stack element inside the context providers `TabStack` wraps it in. */
function stackOf(result: {current: {props: any}}): {screenOptions: Record<string, any>; children: {props: any}} {
  let node = result.current;
  while (!node.props.screenOptions) node = node.props.children;
  return node.props;
}

describe(`TabStack (${Platform.OS})`, () => {
  it('configures the stack header per platform and titles the index screen', async () => {
    const {result} = await renderHook(() => TabStack({title: 'Drops'}), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA">{children}</AccentProvider>,
    });
    // The stack sits under the header context, so `Screen` knows without being told.
    expect(result.current.props.value).toBe(true);
    const {screenOptions, children} = stackOf(result);
    expect(screenOptions).toMatchObject({
      headerShown: true,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal',
    });
    // Web draws the header itself; the native stacks use their own bar.
    expect(screenOptions.header).toBe(Platform.OS === 'web' ? ConstrainedStackHeader : undefined);
    if (Platform.OS === 'web') {
      expect(screenOptions.headerTintColor).toBe(theme.label);
      expect(screenOptions.headerStyle).toEqual({backgroundColor: theme.background});
    } else {
      expect(screenOptions.headerTintColor).toBe(colors.light.label);
      expect(screenOptions.headerTitleStyle).toEqual({color: colors.light.label});
      expect(screenOptions.headerStyle).toEqual({backgroundColor: colors.light.background});
      expect(screenOptions.headerTransparent).toBeUndefined();
    }
    expect(children.props).toMatchObject({name: 'index', options: {title: 'Drops'}});
  });

  if (Platform.OS === 'web') {
    it('leaves the top inset to the screen where the header folds into the bar', async () => {
      const slot = createHeaderSlot();
      const {result} = await renderHook(() => TabStack({title: 'Drops'}), {
        wrapper: ({children}) => <HeaderSlotContext.Provider value={slot}>{children}</HeaderSlotContext.Provider>,
      });
      // No header is drawn under the bar, so `Screen` pays the bar's inset itself.
      expect(result.current.props.value).toBe(false);
    });

    it('passes the header trailing slot to the index screen', async () => {
      const headerRight = () => <Text>New…</Text>;
      const {result} = await renderHook(() => TabStack({title: 'Drops', headerRight}));
      expect(stackOf(result).children.props.options).toEqual({title: 'Drops', headerRight});
    });

    it('renders the index screen under the web stack header', async () => {
      await renderApp(app);
      expect(dom.getByText('Home screen')).toBeInTheDocument();
      expect(dom.getByText('Drops')).toBeInTheDocument();
    });
    return;
  }

  const isIOS = Platform.OS === 'ios';
  const stacked = {
    _layout: () => <TabStack title="Drops" headerRight={() => <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel/>}/>,
    index: () => <Text>Home screen</Text>,
    detail: () => <Text>Detail screen</Text>,
  };

  it('renders the native header with the title', async () => {
    await renderApp(app);
    const header = stackHeaders().find(h => h.title === 'Drops');
    expect(header).toMatchObject({
      hidden: false,
      backgroundColor: colors.light.background,
      titleColor: colors.light.label,
    });
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('declares the trailing slot\'s controls as the index screen\'s bar items', async () => {
    const {result} = await renderHook(() => TabStack({title: 'Drops', headerRight: () => <Text>New…</Text>}));
    // Not a `headerRight` option: natively that slot holds a React Native
    // view. The items are the screen's children, as Expo Router reads them.
    const index = stackOf(result).children;
    expect(index.props.options).toEqual({title: 'Drops'});
    expect(index.props.children.type).toBe(Stack.Toolbar);
    await renderApp(stacked);
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(barItems('Drops').map(item => item.accessibilityLabel)).toEqual(['Copy']);
  });

  it('declares no items without a trailing slot', async () => {
    const {result} = await renderHook(() => TabStack({title: 'Drops'}));
    expect(stackOf(result).children.props.children).toBeNull();
  });

  it('keeps the trailing slot off the other screens of the stack', async () => {
    await renderApp(stacked, '/detail');
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    const detail = stackHeaders().find(h => h.title !== 'Drops');
    expect(detail).toBeDefined();
    expect(detail!.headerRightBarButtonItems ?? []).toEqual([]);
  });

  it('draws an opaque header by default, with the screens below it', async () => {
    const {result} = await renderHook(() => TabStack({title: 'Drops'}));
    // The floating-header context is the stack's second wrapper.
    expect(result.current.props.children.props.value).toBe(false);
  });

  it('draws the header as a material the screens run under on iOS, and the opaque bar on Android', async () => {
    const {result} = await renderHook(() => TabStack({title: 'Drops', material: 'regular'}));
    const {screenOptions} = stackOf(result);
    if (isIOS) {
      // The system's material behind a bar the stack leaves clear.
      expect(result.current.props.children.props.value).toBe(true);
      expect(screenOptions.headerTransparent).toBe(true);
      expect(screenOptions.headerBlurEffect).toBe('systemMaterial');
      expect(screenOptions.headerStyle).toBeUndefined();
    } else {
      // No bar material on Android, and the bar's items and menus take the
      // header's colour: the opaque fill, with the screens below it.
      expect(result.current.props.children.props.value).toBe(false);
      expect(screenOptions.headerTransparent).toBeUndefined();
      expect(screenOptions.headerBlurEffect).toBeUndefined();
      expect(screenOptions.headerStyle).toEqual({backgroundColor: colors.light.background});
    }
  });

  if (isIOS) {
    it('maps each material to the system\'s', async () => {
      const blur = async (material: 'thin' | 'thick') => {
        const {result} = await renderHook(() => TabStack({title: 'Drops', material}));
        return stackOf(result).screenOptions.headerBlurEffect;
      };
      expect(await blur('thin')).toBe('systemThinMaterial');
      expect(await blur('thick')).toBe('systemThickMaterial');
    });
  }
});
