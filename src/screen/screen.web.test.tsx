import type {ColorSchemeName} from 'react-native';
import {View} from 'react-native';
import {render, screen} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Switch} from '../switch';
import {bound, colors, inset} from '../theme';
import {hostAccentProps} from './host-accent';
import {Screen} from '.';

// react-native-web reads the scheme from `matchMedia` (jsdom has none, so it
// always reports light) — swap the hook itself. The web project aliases
// `react-native` to react-native-web, so mocking the alias covers every
// import under test; the per-module `dist/exports/*` path no longer would,
// because the dependency optimizer pre-bundles those files.
const mockScheme: {value: ColorSchemeName} = {value: 'light'};
vi.mock('react-native', async importOriginal => {
  const rn = await importOriginal<typeof import('react-native')>();
  return {...rn, useColorScheme: () => mockScheme.value};
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
  afterEach(() => {
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
    const row = screen.getByText('Wi-Fi').parentElement!;
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
  });

  it('pads the content horizontally with gutter', () => {
    const {rerender} = mount(<Screen><View testID="kid"/></Screen>);
    const hasGutter = () => [...parts(screen.getByTestId('kid')).content.classList]
      .some(c => c.startsWith('r-paddingInline-'));
    expect(hasGutter()).toBe(false);

    rerender(<SafeAreaProvider><Screen gutter><View testID="kid"/></Screen></SafeAreaProvider>);
    expect(hasGutter()).toBe(true);
  });

  it('paints the scheme background and mirrors it to the document body', () => {
    mount(<Screen><View testID="kid"/></Screen>);
    expect(parts(screen.getByTestId('kid')).safeArea).toHaveStyle({backgroundColor: colors.light.background});
    expect(document.body).toHaveStyle({backgroundColor: colors.light.background});
  });

  it('switches to the dark palette', () => {
    mockScheme.value = 'dark';
    mount(<Screen><View testID="kid"/></Screen>);
    expect(parts(screen.getByTestId('kid')).safeArea).toHaveStyle({backgroundColor: colors.dark.background});
    expect(document.body).toHaveStyle({backgroundColor: colors.dark.background});
  });
});
