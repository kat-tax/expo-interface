import {Linking} from 'react-native';
import {ExpoWebBrowser} from './web-browser';

type UrlListener = (event: {url: string}) => void;

function captureUrlListener() {
  let listener: UrlListener | null = null;
  const remove = vi.fn();
  vi.spyOn(Linking, 'addEventListener').mockImplementation((_type, handler) => {
    listener = handler as UrlListener;
    return {remove} as never;
  });
  return {fire: (url: string) => listener!({url}), remove};
}

describe('ExpoWebBrowser (windows)', () => {
  it('opens a page in the default browser through Linking', async () => {
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await expect(ExpoWebBrowser.openBrowserAsync('https://expo.dev')).resolves.toEqual({type: 'opened'});
    expect(openURL).toHaveBeenCalledWith('https://expo.dev');
    await expect(ExpoWebBrowser.dismissBrowser()).resolves.toBeUndefined();
  });

  it('completes an auth session when the app is activated with the redirect URL', async () => {
    vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const {fire, remove} = captureUrlListener();
    const result = ExpoWebBrowser.openAuthSessionAsync('https://auth.example/start', 'dropfiles://auth');
    await Promise.resolve();
    fire('dropfiles://other');
    fire('dropfiles://auth?code=1');
    await expect(result).resolves.toEqual({type: 'success', url: 'dropfiles://auth?code=1'});
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('takes any activation without a redirect URL, and dismisses on request or when a new session starts', async () => {
    vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const {fire} = captureUrlListener();
    const first = ExpoWebBrowser.openAuthSessionAsync('https://auth.example/a', null);
    await Promise.resolve();
    const second = ExpoWebBrowser.openAuthSessionAsync('https://auth.example/b', null);
    await expect(first).resolves.toEqual({type: 'dismiss'});
    await Promise.resolve();
    fire('anything://x');
    await expect(second).resolves.toEqual({type: 'success', url: 'anything://x'});
    const third = ExpoWebBrowser.openAuthSessionAsync('https://auth.example/c', null);
    await Promise.resolve();
    ExpoWebBrowser.dismissAuthSession();
    await expect(third).resolves.toEqual({type: 'dismiss'});
    // Nothing pending: dismissing is a no-op.
    ExpoWebBrowser.dismissAuthSession();
    expect(ExpoWebBrowser.maybeCompleteAuthSession()).toMatchObject({type: 'failed'});
  });
});
