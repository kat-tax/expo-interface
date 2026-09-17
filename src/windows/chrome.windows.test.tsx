import {act, render} from '@testing-library/react-native';
import {Text} from 'react-native';
import {reportDragRegion, setDragRegion, useWindowChrome, useWindowChromeState} from './chrome.windows';

interface WindowsModule {
  setWindowChromeAsync: (options: {extend: boolean; theme: string}) => Promise<boolean>;
  getTitleBarInsetsAsync: () => Promise<{left: number; right: number; height: number}>;
  setDragRegion: (region: object) => void;
}

/** The runtime's window module, as its install registers it — or none, as in an app without the runtime. */
const runtime = vi.hoisted(() => ({module: null as WindowsModule | null}));
vi.mock('expo-modules-core', async importOriginal => ({
  ...(await importOriginal<typeof import('expo-modules-core')>()),
  requireOptionalNativeModule: (name: string) => (name === 'ExpoWindows' ? runtime.module : null),
}));

function Chrome({extend}: {extend: boolean}) {
  useWindowChrome({extend});
  return <State/>;
}

function State() {
  const chrome = useWindowChromeState();
  return <Text testID="state">{`${chrome.extended} ${chrome.insets.right} ${chrome.insets.height}`}</Text>;
}

const insets = async () => ({left: 0, right: 138, height: 32});
const flush = () => act(async () => {});

describe('useWindowChrome (windows)', () => {
  afterEach(() => {
    runtime.module = null;
  });

  it('extends the content into the title bar through the runtime, publishes the insets, and takes it back', async () => {
    const setWindowChromeAsync = vi.fn(async () => true);
    const getTitleBarInsetsAsync = vi.fn(insets);
    runtime.module = {setWindowChromeAsync, getTitleBarInsetsAsync, setDragRegion: vi.fn()};
    const {getByTestId, rerender} = await render(<Chrome extend/>);
    await flush();
    expect(setWindowChromeAsync).toHaveBeenCalledWith({extend: true, theme: expect.stringMatching(/^(light|dark)$/)});
    expect(getByTestId('state')).toHaveTextContent('true 138 32');
    await rerender(<Chrome extend={false}/>);
    await flush();
    expect(setWindowChromeAsync).toHaveBeenLastCalledWith({extend: false, theme: expect.any(String)});
    expect(getTitleBarInsetsAsync).toHaveBeenCalledTimes(1);
    expect(getByTestId('state')).toHaveTextContent('false 0 0');
  });

  it('stays unextended where the title bar cannot be customized, when the runtime fails, or without it', async () => {
    runtime.module = {setWindowChromeAsync: async () => false, getTitleBarInsetsAsync: insets, setDragRegion: vi.fn()};
    const {getByTestId, rerender} = await render(<Chrome extend/>);
    await flush();
    expect(getByTestId('state')).toHaveTextContent('false 0 0');
    // A runtime that fails: asked again, the chrome stays as it is.
    const failing = vi.fn(() => Promise.reject(new Error('no window')));
    runtime.module = {setWindowChromeAsync: failing, getTitleBarInsetsAsync: insets, setDragRegion: vi.fn()};
    await rerender(<Chrome extend={false}/>);
    await flush();
    expect(failing).toHaveBeenCalledTimes(1);
    expect(getByTestId('state')).toHaveTextContent('false 0 0');
    // No runtime: nothing is asked.
    runtime.module = null;
    await rerender(<Chrome extend/>);
    await flush();
    expect(failing).toHaveBeenCalledTimes(1);
    expect(getByTestId('state')).toHaveTextContent('false 0 0');
  });

  it('drops an answer that arrives after the asker is gone', async () => {
    let answer: (taken: boolean) => void = () => {};
    runtime.module = {
      setWindowChromeAsync: () => new Promise<boolean>(resolve => (answer = resolve)),
      getTitleBarInsetsAsync: insets,
      setDragRegion: vi.fn(),
    };
    const observer = await render(<State/>);
    const asker = await render(<Chrome extend/>);
    asker.unmount();
    await act(async () => answer(true));
    await flush();
    expect(observer.getByTestId('state')).toHaveTextContent('false 0 0');
  });

  it('hands the drag region to the runtime, and drops it without one', () => {
    const drag = vi.fn();
    runtime.module = {setWindowChromeAsync: async () => true, getTitleBarInsetsAsync: insets, setDragRegion: drag};
    setDragRegion({x: 0, y: 0, width: 800, height: 48});
    expect(drag).toHaveBeenCalledWith({x: 0, y: 0, width: 800, height: 48});
    runtime.module = null;
    expect(() => setDragRegion({x: 0, y: 0, width: 1, height: 1})).not.toThrow();
  });

  it('measures a header row in the window for the drag region, leaving the caption buttons their room', () => {
    const drag = vi.fn();
    runtime.module = {setWindowChromeAsync: async () => true, getTitleBarInsetsAsync: insets, setDragRegion: drag};
    reportDragRegion({measureInWindow: callback => callback(48, 0, 952, 48)}, 138);
    expect(drag).toHaveBeenCalledWith({x: 48, y: 0, width: 952 - 138, height: 48});
    reportDragRegion({measureInWindow: callback => callback(0, 0, 100, 48)}, 138);
    expect(drag).toHaveBeenLastCalledWith({x: 0, y: 0, width: 0, height: 48});
    expect(() => reportDragRegion(null, 138)).not.toThrow();
  });
});
