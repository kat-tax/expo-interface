import type {ReactNode} from 'react';
import {useContext, useEffect} from 'react';
import {Animated, Platform, StyleSheet, Text, View} from 'react-native';
import {act, fireEvent, render, screen, within} from '@testing-library/react-native';
import {setColorScheme, setInsets} from 'vitest-native/helpers';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {AccentProvider} from '../accent';
import {colors, inset, spacing} from '../theme';
import {Switch} from '../switch';
import {host, modifier, nodes} from 'expo-vitest/native';
import {hostAccentProps} from './host-accent';
import {HeaderAccessory} from '../header-accessory';
import {FloatingHeaderContext, HeaderMaterialContext, StackHeaderContext} from '../stack-header/context';
import {NativeTabsContext, useTabBarInset} from '../tabs/context';
import {useScrollInsets} from './insets';
import {ToastInsetContext} from '../toast/context';
import {Screen} from '.';

vi.mock('expo-system-ui');

// The shared `vi.mock('expo', ...)` in expo-vitest's native setup supplies the
// `ExpoUI` native module pieces the Host asks for on mount (`getMaterialColors`
// for the Compose palette, `ObservableState`); nothing extra is needed here.

const isIOS = Platform.OS === 'ios';
// Every @expo/ui view mounts as a `ViewManagerAdapter_ExpoUI_*` host element;
// the Host itself is the `_HostView` variant.
const HOST_PREFIX = 'ViewManagerAdapter_ExpoUI';
const HOST = `${HOST_PREFIX}_HostView`;

/** Root safe area view and the two layout views `Screen` nests inside it. */
function parts() {
  const [safeArea, root, content] = nodes();
  return {safeArea, root, content};
}

describe(`Screen (${Platform.OS})`, () => {
  afterEach(async () => {
    // RNTL v14's `act` is async — an un-awaited call leaves the act scope
    // open and the next test renders into it (empty `screen` tree).
    await act(async () => setColorScheme('light'));
  });

  it('renders plain React Native children without an @expo/ui Host', async () => {
    await render(<Screen><View testID="kid"/></Screen>);
    expect(screen.getByTestId('kid')).toBeOnTheScreen();
    expect(nodes().some(n => n.type.startsWith(HOST_PREFIX))).toBe(false);
  });

  it('mounts an accent-seeded Host around native children', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Screen native>
          <Switch label="Wi-Fi" value onValueChange={() => {}}/>
        </Screen>
      </AccentProvider>,
    );
    const hostView = nodes().find(n => n.type === HOST);
    expect(hostView).toBeDefined();
    expect(hostView!.props).toMatchObject(hostAccentProps('#8959EA'));
    if (isIOS) {
      expect(modifier(hostView!.props, 'tint')).toEqual({$type: 'tint', tint: {type: 'color', color: '#8959EA'}});
      expect(host(p => p.label === 'Wi-Fi')).toBeTruthy();
    } else {
      expect(hostView!.props.seedColor).toBe('#8959EA');
      expect(host(p => p.text === 'Wi-Fi')).toBeTruthy();
    }
  });

  it('applies the default accent seed to the Host', async () => {
    await render(<Screen native><Switch value onValueChange={() => {}}/></Screen>);
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView.props).toMatchObject(hostAccentProps(colors.light.tint));
  });

  it('keeps every safe-area edge and the top-bar inset by default', async () => {
    await render(<Screen><View/></Screen>);
    const {safeArea, root} = parts();
    expect(safeArea.props.edges).toEqual(['top', 'left', 'right', 'bottom']);
    expect(StyleSheet.flatten(root.props.style).paddingTop).toBe(inset.topBar);
  });

  it('leaves the bottom inset to the tab host under the native tabs on Android, which pays it already', async () => {
    await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 24}));
    try {
      await render(
        <NativeTabsContext.Provider value={true}>
          <Screen fab={<Text>New</Text>}><View/></Screen>
        </NativeTabsContext.Provider>,
      );
      const {safeArea} = parts();
      const fab = StyleSheet.flatten(screen.getByTestId('screen-fab').props.style);
      if (isIOS) {
        // iOS's tab controller lays the screens out under the bar, so the
        // safe-area view's bottom inset is the only one paid.
        expect(safeArea.props.edges).toEqual(['top', 'left', 'right', 'bottom']);
        expect(fab.bottom).toBe(spacing.three + 24);
      } else {
        // Android's tab host keeps its screens above the navigation bar
        // itself: the safe-area view would pay the inset a second time.
        expect(safeArea.props.edges).toEqual(['top', 'left', 'right']);
        expect(fab.bottom).toBe(spacing.three);
      }
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });

  it('keeps the header height clear under a header the screens run under, unless the content passes under it', async () => {
    await act(async () => setInsets({top: 47, left: 0, right: 0, bottom: 0}));
    try {
      const floating = (node: ReactNode) => (
        <StackHeaderContext.Provider value={true}>
          <FloatingHeaderContext.Provider value={true}>{node}</FloatingHeaderContext.Provider>
        </StackHeaderContext.Provider>
      );
      await render(floating(<Screen><View/></Screen>));
      // The status bar and the bar below it, since the top edge is not paid under a header.
      expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(47 + inset.header);
      expect(parts().safeArea.props.edges).toEqual(['left', 'right', 'bottom']);
      await render(floating(<Screen underBar><View/></Screen>));
      // The content pads itself by `useTabBarInset()` instead.
      expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(0);
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });

  it('floats a header accessory at the bottom edge of a header the screens run under, in its material, and pays its height', async () => {
    await act(async () => setInsets({top: 47, left: 0, right: 0, bottom: 0}));
    try {
      const seen = {bar: -1, scroll: -1};
      function Probe() {
        const bar = useTabBarInset();
        const scroll = useScrollInsets().top;
        useEffect(() => {
          seen.bar = bar;
          seen.scroll = scroll;
        });
        return null;
      }
      const floating = (node: ReactNode, material?: 'thin') => (
        <StackHeaderContext.Provider value={true}>
          <FloatingHeaderContext.Provider value={true}>
            {material ? <HeaderMaterialContext.Provider value={material}>{node}</HeaderMaterialContext.Provider> : node}
          </FloatingHeaderContext.Provider>
        </StackHeaderContext.Provider>
      );
      const strip = <HeaderAccessory><Text>Strip</Text></HeaderAccessory>;
      await render(floating(<Screen>{strip}<Probe/></Screen>, 'thin'));
      const rows = screen.getByTestId('screen-header-rows');
      expect(within(rows).getByText('Strip')).toBeOnTheScreen();
      expect(StyleSheet.flatten(rows.props.style)).toMatchObject({position: 'absolute', top: 47 + inset.header, left: 0, right: 0});
      if (isIOS) {
        const shape = nodes().find(n => n.type.includes('RoundedRectangle'))!;
        expect(modifier(shape.props, 'foregroundStyle')?.style).toMatchObject({type: 'material', material: 'thin'});
      }
      // Measured, and paid as the header is: below it for the screen, in the bar's inset for the content.
      await fireEvent(rows, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 40}}});
      expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(47 + inset.header + 40);
      expect(seen.bar).toBe(47 + inset.header + 40);

      // Content passing under the header passes under the row too, and a kit scroll view pads both: on iOS
      // the platform insets it by the header itself, so the kit adds the row alone.
      await render(floating(<Screen underBar>{strip}<Probe/></Screen>));
      await fireEvent(screen.getByTestId('screen-header-rows'), 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 40}}});
      expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(0);
      expect(seen.scroll).toBe(isIOS ? 40 : 47 + inset.header + 40);
      if (isIOS) {
        // A header with no material of its own named gets the regular one.
        const shape = nodes().find(n => n.type.includes('RoundedRectangle'))!;
        expect(modifier(shape.props, 'foregroundStyle')?.style).toMatchObject({type: 'material', material: 'regular'});
      }
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });

  it('puts a header accessory above the content under an opaque header, where nothing passes under it', async () => {
    await render(
      <StackHeaderContext.Provider value={true}>
        <Screen>
          <HeaderAccessory><Text>Strip</Text></HeaderAccessory>
          <Text>Body</Text>
        </Screen>
      </StackHeaderContext.Provider>,
    );
    expect(screen.queryByTestId('screen-header-rows')).toBeNull();
    expect(screen.getByText('Strip')).toBeOnTheScreen();
    expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(0);
  });

  it('changes nothing for underBar, since the top inset is already nothing natively', async () => {
    await render(<Screen underBar><View/></Screen>);
    expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(0);
    expect(inset.topBar).toBe(0);
  });

  it('drops the top edge and inset under a stack header', async () => {
    await render(<Screen header><View/></Screen>);
    const {safeArea, root} = parts();
    expect(safeArea.props.edges).toEqual(['left', 'right', 'bottom']);
    expect(StyleSheet.flatten(root.props.style).paddingTop).toBe(0);
  });

  it('takes the header from the navigator above it, and the prop over that', async () => {
    await render(
      <StackHeaderContext.Provider value={true}>
        <Screen><View/></Screen>
      </StackHeaderContext.Provider>,
    );
    expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(0);
    await render(
      <StackHeaderContext.Provider value={true}>
        <Screen header={false}><View/></Screen>
      </StackHeaderContext.Provider>,
    );
    expect(StyleSheet.flatten(parts().root.props.style).paddingTop).toBe(inset.topBar);
  });

  it('constrains content width and pads it with gutter', async () => {
    await render(<Screen><View/></Screen>);
    expect(StyleSheet.flatten(parts().content.props.style)).toMatchObject({width: '100%', maxWidth: 800});
    expect(StyleSheet.flatten(parts().content.props.style).paddingHorizontal).toBeUndefined();

    await render(<Screen gutter><View/></Screen>);
    expect(StyleSheet.flatten(parts().content.props.style).paddingHorizontal).toBe(spacing.three);
  });

  it('paints the scheme background and syncs it to the system UI', async () => {
    await render(<Screen><View/></Screen>);
    expect(parts().safeArea.props.style.backgroundColor).toBe(colors.light.background);
    expect(setBackgroundColorAsync).toHaveBeenCalledWith(colors.light.background);

    await act(async () => setColorScheme('dark'));
    await render(<Screen><View/></Screen>);
    expect(parts().safeArea.props.style.backgroundColor).toBe(colors.dark.background);
    expect(setBackgroundColorAsync).toHaveBeenLastCalledWith(colors.dark.background);
  });

  it('floats the fab slot at the bottom trailing corner, above the safe-area insets', async () => {
    await act(async () => setInsets({top: 0, left: 0, right: 4, bottom: 34}));
    try {
      await render(
        <Screen fab={<Text>New</Text>}>
          <View/>
        </Screen>,
      );
      const slot = screen.getByTestId('screen-fab');
      expect(screen.getByText('New')).toBeOnTheScreen();
      expect(StyleSheet.flatten(slot.props.style)).toMatchObject({
        position: 'absolute',
        right: spacing.three + 4,
        bottom: spacing.three + 34,
        // Only the button takes presses, not the slot around it.
        pointerEvents: 'box-none',
      });
      // The slot is a sibling of the content, on top of it.
      const last = parts().safeArea.children?.at(-1);
      expect(typeof last === 'object' && last?.props.testID).toBe('screen-fab');
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });

  it('renders no fab slot without a fab', async () => {
    await render(<Screen><View/></Screen>);
    expect(screen.queryByTestId('screen-fab')).toBeNull();
  });

  it('lifts the fab above a toast that reports its height, and lowers it as the toast goes', async () => {
    const timing = vi.spyOn(Animated, 'timing');
    try {
      const {rerender} = await render(
        <Screen fab={<Text>New</Text>}>
          <ToastStandIn height={68}/>
        </Screen>,
      );
      // The slot rides a transform the native driver can animate, by the
      // toast's height, the way Material's scaffold moves its button.
      expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: -68, useNativeDriver: true}));
      const slot = screen.getByTestId('screen-fab');
      expect(StyleSheet.flatten(slot.props.style).transform).toEqual([{translateY: expect.anything()}]);

      await rerender(
        <Screen fab={<Text>New</Text>}>
          <ToastStandIn height={0}/>
        </Screen>,
      );
      expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: -0}));
    } finally {
      timing.mockRestore();
    }
  });
});

/** What a toast under the screen does: reports what it covers of the bottom edge. */
function ToastStandIn({height}: {height: number}) {
  const report = useContext(ToastInsetContext);
  useEffect(() => {
    report(height);
  }, [height, report]);
  return null;
}
