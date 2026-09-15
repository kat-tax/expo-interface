import type {EmitterSubscription} from 'react-native';
import {Linking} from 'react-native';

type BrowserResult = {type: 'cancel' | 'dismiss' | 'opened' | 'locked'};
type AuthSessionResult = BrowserResult | {type: 'success'; url: string};

let session: {resolve(result: AuthSessionResult): void; subscription: EmitterSubscription} | null = null;

function endSession(result: AuthSessionResult): void {
  if (!session) return;
  const {resolve, subscription} = session;
  session = null;
  subscription.remove();
  resolve(result);
}

/**
 * `ExpoWebBrowser`, what `expo-web-browser` opens pages through. A desktop
 * has no in-app browser to present, so `openBrowserAsync` hands the URL to
 * the default browser through `Linking` and reports it opened. An auth
 * session opens the same way and then waits for the app to be activated
 * with a URL under `redirectUrl` — the way a Windows app registered for its
 * scheme receives the provider's redirect — or for `dismissAuthSession`.
 * The Android warm-up calls are not here; the package treats them as
 * unavailable elsewhere too.
 */
export const ExpoWebBrowser = {
  async openBrowserAsync(url: string, _options: object = {}): Promise<BrowserResult> {
    await Linking.openURL(url);
    return {type: 'opened'};
  },

  async dismissBrowser(): Promise<void> {},

  async openAuthSessionAsync(url: string, redirectUrl: string | null, _options: object = {}): Promise<AuthSessionResult> {
    endSession({type: 'dismiss'});
    await Linking.openURL(url);
    return new Promise<AuthSessionResult>(resolve => {
      const subscription = Linking.addEventListener('url', event => {
        if (!redirectUrl || event.url.startsWith(redirectUrl)) endSession({type: 'success', url: event.url});
      });
      session = {resolve, subscription};
    });
  },

  dismissAuthSession(): void {
    endSession({type: 'dismiss'});
  },

  maybeCompleteAuthSession(_options: object = {}): {type: 'success' | 'failed'; message?: string} {
    return {type: 'failed', message: 'Not supported on Windows'};
  },
};
