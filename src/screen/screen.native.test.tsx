import {Platform, StyleSheet, View} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {setColorScheme} from 'vitest-native/helpers';
import {setBackgroundColorAsync} from 'expo-system-ui';
import {AccentProvider} from '../accent';
import {colors, inset, spacing} from '../theme';
import {Switch} from '../switch';
import {host, modifier, nodes} from '../__tests__/native';
import {hostAccentProps} from './host-accent';
import {Screen} from '.';

vi.mock('expo-system-ui');

// The shared `vi.mock('expo', ...)` in vitest/setup.native.ts supplies the
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
      expect(modifier(hostView!.props, 'tint')).toEqual({$type: 'tint', color: '#8959EA'});
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
    // No `edges` prop — the real SafeAreaView applies all four edges.
    expect(safeArea.props.edges).toBeUndefined();
    expect(StyleSheet.flatten(root.props.style).paddingTop).toBe(inset.topBar);
  });

  it('drops the top edge and inset under a stack header', async () => {
    await render(<Screen header><View/></Screen>);
    const {safeArea, root} = parts();
    expect(safeArea.props.edges).toEqual(['left', 'right', 'bottom']);
    expect(StyleSheet.flatten(root.props.style).paddingTop).toBe(0);
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
});
