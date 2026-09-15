import {Linking} from 'react-native';
import {createLinkingModule} from './linking';

type UrlListener = (event: {url: string}) => void;

describe('ExpoLinking (windows)', () => {
  it('keeps the URL the app was launched with, and clears it on request', async () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue('dropfiles://drop/1');
    const linking = createLinkingModule();
    expect(linking.getLinkingURL()).toBeNull();
    await Promise.resolve();
    expect(linking.getLinkingURL()).toBe('dropfiles://drop/1');
    linking.clearInitialURL();
    expect(linking.getLinkingURL()).toBeNull();
  });

  it('starts without a URL when the launch had none, or when asking failed', async () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    const plain = createLinkingModule();
    await Promise.resolve();
    expect(plain.getLinkingURL()).toBeNull();
    vi.spyOn(Linking, 'getInitialURL').mockRejectedValue(new Error('no activation'));
    const failed = createLinkingModule();
    await Promise.resolve();
    await Promise.resolve();
    expect(failed.getLinkingURL()).toBeNull();
  });

  // Expo Modules Core's emitter calls `startObserving` on the first listener
  // and `stopObserving` after the last; the harness's stand-in does not, so
  // the hooks are driven here and the emit is watched.
  it('forwards incoming URLs as onURLReceived while observed', async () => {
    vi.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    let listener: UrlListener | null = null;
    const remove = vi.fn();
    const addEventListener = vi.spyOn(Linking, 'addEventListener').mockImplementation((_type, handler) => {
      listener = handler as UrlListener;
      return {remove} as never;
    });
    const linking = createLinkingModule();
    const emit = vi.spyOn(linking, 'emit').mockImplementation(() => {});
    linking.startObserving();
    linking.startObserving();
    expect(addEventListener).toHaveBeenCalledTimes(1);
    listener!({url: 'dropfiles://drop/2'});
    expect(emit).toHaveBeenCalledWith('onURLReceived', 'dropfiles://drop/2');
    expect(linking.getLinkingURL()).toBe('dropfiles://drop/2');
    linking.stopObserving();
    linking.stopObserving();
    expect(remove).toHaveBeenCalledTimes(1);
    linking.startObserving();
    expect(addEventListener).toHaveBeenCalledTimes(2);
  });
});
