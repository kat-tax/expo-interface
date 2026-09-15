import {registerModule} from './registry';
import {ExpoAsset} from './asset';
import {createClipboardModule} from './clipboard';
import {ExponentConstants} from './constants';
import {ExpoDevice} from './device';
import {createFontLoaderModule} from './font-loader';
import {ExpoKeepAwake} from './keep-awake';
import {createLinkingModule} from './linking';
import {ExpoSharing} from './sharing';
import {ExpoSystemUI} from './system-ui';
import {ExpoWebBrowser} from './web-browser';

/**
 * Registers every Windows module under the name its Expo package asks
 * `requireNativeModule` for. A module with events is a `NativeModule`
 * subclass, created here from the class the installed global holds; one
 * that is only constants and functions is a plain object. What is not here
 * — `ExpoGo`, `ExpoUpdates`, `ExpoSplashScreen` — is asked for optionally
 * by its package and stays absent, as it is in a bare app on any platform.
 */
export function registerModules(): void {
  registerModule('ExpoLinking', createLinkingModule());
  registerModule('ExponentConstants', ExponentConstants);
  registerModule('ExpoAsset', ExpoAsset);
  registerModule('ExpoFontLoader', createFontLoaderModule());
  registerModule('ExpoWebBrowser', ExpoWebBrowser);
  registerModule('ExpoSystemUI', ExpoSystemUI);
  registerModule('ExpoKeepAwake', ExpoKeepAwake);
  registerModule('ExpoClipboard', createClipboardModule());
  registerModule('ExpoSharing', ExpoSharing);
  registerModule('ExpoDevice', ExpoDevice);
}
