import {act, render} from '@testing-library/react-native';
import {Text} from 'react-native';
import {NO_CONTRAST, highContrastPalette, useHighContrast} from './contrast.windows';

interface State {
  enabled: boolean;
  scheme: string;
  colors: Record<string, string>;
}

interface WindowsModule {
  getHighContrastAsync: () => Promise<State>;
  addHighContrastListener: (listener: (state: State) => void) => {remove(): void};
}

/** The runtime's window module, as its install registers it — or none, as in an app without the runtime. */
const runtime = vi.hoisted(() => ({module: null as WindowsModule | null}));
vi.mock('expo-modules-core', async importOriginal => ({
  ...(await importOriginal<typeof import('expo-modules-core')>()),
  requireOptionalNativeModule: (name: string) => (name === 'ExpoWindows' ? runtime.module : null),
}));

const black = {
  background: '#000000',
  text: '#FFFFFF',
  highlight: '#1AEBFF',
  highlightText: '#000000',
  buttonFace: '#000000',
  buttonText: '#FFFFFF',
  link: '#FFFF00',
  disabledText: '#3FF23F',
};

function Contrast() {
  const contrast = useHighContrast();
  return <Text testID="state">{`${contrast.enabled} ${contrast.scheme} ${contrast.colors?.text ?? '-'}`}</Text>;
}

const flush = () => act(async () => {});

/** A runtime whose listener the test can call, reporting `initial` when asked. */
function library(initial: State) {
  const listeners = new Set<(state: State) => void>();
  const remove = vi.fn();
  runtime.module = {
    getHighContrastAsync: vi.fn(async () => initial),
    addHighContrastListener: listener => {
      listeners.add(listener);
      return {remove};
    },
  };
  return {change: (state: State) => act(() => listeners.forEach(listener => listener(state))), remove};
}

describe('useHighContrast (windows)', () => {
  afterEach(() => {
    runtime.module = null;
  });

  it('reads the setting from the runtime, follows a change, and stops following with the last reader', async () => {
    const {change, remove} = library({enabled: true, scheme: 'High Contrast Black', colors: black});
    const {getByTestId, unmount} = await render(<Contrast/>);
    await flush();
    expect(getByTestId('state')).toHaveTextContent('true High Contrast Black #FFFFFF');
    await change({enabled: false, scheme: '', colors: {...black, text: '#000000'}});
    // Off: no colours, whatever the system reports for them.
    expect(getByTestId('state')).toHaveTextContent('false  -');
    await change({enabled: true, scheme: 'High Contrast White', colors: {...black, text: '#000000'}});
    expect(getByTestId('state')).toHaveTextContent('true High Contrast White #000000');
    expect(remove).not.toHaveBeenCalled();
    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('is off without the runtime, and stays off when the runtime cannot say', async () => {
    const {getByTestId, unmount} = await render(<Contrast/>);
    await flush();
    expect(getByTestId('state')).toHaveTextContent('false  -');
    await unmount();
    runtime.module = {
      getHighContrastAsync: vi.fn(async () => {
        throw new Error('no settings');
      }),
      addHighContrastListener: () => ({remove: vi.fn()}),
    };
    const second = await render(<Contrast/>);
    await flush();
    expect(second.getByTestId('state')).toHaveTextContent('false  -');
    await second.unmount();
    // A runtime from before the setting was read (expo-windows 0.3.0) has no call for it.
    runtime.module = {} as WindowsModule;
    const third = await render(<Contrast/>);
    await flush();
    expect(third.getByTestId('state')).toHaveTextContent('false  -');
  });

  it('exports the mapping and the off state for the shared code', () => {
    expect(NO_CONTRAST.enabled).toBe(false);
    expect(highContrastPalette(black).tint).toBe('#1AEBFF');
  });
});
