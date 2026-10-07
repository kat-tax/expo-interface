import type {ColorSchemeName} from 'react-native';
import {useContext, useEffect} from 'react';
import {Animated, Text, View} from 'react-native';
import {render, screen} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Switch} from '../switch';
import {bound, inset, spacing, theme} from '../theme';
import {ToastInsetContext} from '../toast/context';
import {hostAccentProps} from './host-accent';
import {Screen} from '.';

// react-native-web reads the scheme from `matchMedia` (jsdom has none, so it
// always reports light) — swap `Appearance` itself, which the kit's
// `useColorScheme` store reads. The web project aliases `react-native` to
// react-native-web, so mocking the alias covers every import under test.
// Hoisted with the mock: `Screen` reads the scheme at module load, before
// the test body's declarations would run (it reads no scheme then, like a
// server render, and falls back to the unspecified one).
const mockScheme = vi.hoisted((): {value: ColorSchemeName | undefined} => ({value: undefined}));
vi.mock('react-native', async importOriginal => {
  const rn = await importOriginal<typeof import('react-native')>();
  return {
    ...rn,
    Appearance: {...rn.Appearance, getColorScheme: () => mockScheme.value},
  };
});

/** Web `SafeAreaView` requires a provider. */
function mount(ui: React.ReactElement) {
  return render(<SafeAreaProvider>{ui}</SafeAreaProvider>);
}

/** Walks up from the child to `Screen`'s content, root and safe-area elements. */
function parts(child: HTMLElement, native = false) {
  const content = (native ? child.parentElement!.parentElement : child.parentElement)!;
  const root = content.parentElement!;
  const safeArea = root.parentElement!;
  return {content, root, safeArea};
}

describe('Screen (web)', () => {
  beforeEach(() => {
    mockScheme.value = 'light';
  });

  it('renders plain children directly inside the constrained content box', () => {
    mount(<Screen><View testID="kid"/></Screen>);
    const {content} = parts(screen.getByTestId('kid'));
    expect(getComputedStyle(content).maxWidth).toBe(`${bound.contentMaxWidth}px`);
    expect(content.style.getPropertyValue('--expo-ui-primary-500')).toBe('');
  });

  it('wraps native children in an @expo/ui Host', () => {
    mount(
      <Screen native>
        <Switch label="Wi-Fi" value onValueChange={() => {}}/>
      </Screen>,
    );
    // The label sits in its column, in the switch's row, in the host.
    const row = screen.getByText('Wi-Fi').parentElement!.parentElement!;
    const hostView = row.parentElement!;
    // The web Host carries the Expo UI palette as custom properties.
    expect(hostView.style.getPropertyValue('--expo-ui-primary-500')).not.toBe('');
    expect(getComputedStyle(parts(row, true).content).maxWidth).toBe(`${bound.contentMaxWidth}px`);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('applies no Host accent props on web (the accent flows through CSS)', () => {
    expect(hostAccentProps('#8959EA')).toEqual({});
  });

  it('reserves the floating tab bar inset unless under a stack header', () => {
    const {rerender} = mount(<Screen><View testID="kid"/></Screen>);
    expect(inset.topBar).toBe(80);
    const paddingTop = () => getComputedStyle(parts(screen.getByTestId('kid')).root).paddingTop;
    expect(paddingTop()).toBe(`${inset.topBar}px`);

    rerender(<SafeAreaProvider><Screen header><View testID="kid"/></Screen></SafeAreaProvider>);
    expect(paddingTop()).toBe('0px');

    // A screen whose content passes under a material bar pays no inset at
    // the root either: its scroll content pads itself by `useTabBarInset()`.
    rerender(<SafeAreaProvider><Screen underBar><View testID="kid"/></Screen></SafeAreaProvider>);
    expect(paddingTop()).toBe('0px');
  });

  it('pads the content horizontally with gutter', () => {
    const {rerender} = mount(<Screen><View testID="kid"/></Screen>);
    const hasGutter = () => [...parts(screen.getByTestId('kid')).content.classList]
      .some(c => c.startsWith('r-paddingInline-'));
    expect(hasGutter()).toBe(false);

    rerender(<SafeAreaProvider><Screen gutter><View testID="kid"/></Screen></SafeAreaProvider>);
    expect(hasGutter()).toBe(true);
  });

  it('paints the palette variable, not a literal, so the static export follows the scheme before hydration', () => {
    mount(<Screen><View testID="kid"/></Screen>);
    expect(theme.background).toBe('var(--color-background)');
    expect(getComputedStyle(parts(screen.getByTestId('kid')).safeArea).backgroundColor).toBe(theme.background);
    expect(document.body.style.backgroundColor).toBe(theme.background);
  });

  it('keeps the variable in the dark scheme and when the scheme is unknown', () => {
    mockScheme.value = 'dark';
    const {unmount} = mount(<Screen><View testID="kid"/></Screen>);
    expect(getComputedStyle(parts(screen.getByTestId('kid')).safeArea).backgroundColor).toBe(theme.background);
    unmount();

    mockScheme.value = undefined;
    mount(<Screen><View testID="kid"/></Screen>);
    expect(getComputedStyle(parts(screen.getByTestId('kid')).safeArea).backgroundColor).toBe(theme.background);
  });

  it('fixes the fab slot to the viewport corner', () => {
    mount(
      <Screen fab={<Text testID="fab">New</Text>}>
        <View testID="kid"/>
      </Screen>,
    );
    const slot = screen.getByTestId('screen-fab');
    expect(slot.contains(screen.getByTestId('fab'))).toBe(true);
    const style = getComputedStyle(slot);
    expect(style.position).toBe('fixed');
    expect(style.right).toBe(`${spacing.three}px`);
    expect(style.bottom).toBe(`${spacing.three}px`);
    expect(slot.parentElement).toBe(parts(screen.getByTestId('kid')).safeArea);
  });

  it('renders no fab slot without a fab', () => {
    mount(<Screen><View testID="kid"/></Screen>);
    expect(screen.queryByTestId('screen-fab')).toBeNull();
  });

  it('lifts the fab above a toast that reports its height, on the JavaScript driver', () => {
    const timing = vi.spyOn(Animated, 'timing');
    try {
      mount(
        <Screen fab={<Text testID="fab">New</Text>}>
          <ToastStandIn height={68}/>
        </Screen>,
      );
      // react-native-web has no native driver and warns when asked for one.
      expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: -68, useNativeDriver: false}));
      expect(screen.getByTestId('screen-fab').contains(screen.getByTestId('fab'))).toBe(true);
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
