import {registerModule} from './registry';
import {ExpoAgeRange} from './age-range';
import {ExpoApplication} from './application';
import {ExpoAsset} from './asset';
import {ExpoBackgroundFetch, ExpoBackgroundTask, ExpoTaskManager} from './background';
import {createBlobModule} from './blob';
import {ExpoBrightness} from './brightness';
import {CalendarNext, ExpoCalendar} from './calendar';
import {ExpoCellular} from './cellular';
import {createClipboardModule} from './clipboard';
import {ExponentConstants} from './constants';
import {ExpoContacts, ExpoContactsNext} from './contacts';
import {createCryptoAesModule, ExpoCrypto} from './crypto';
import {ExpoDevice} from './device';
import {ExpoDocumentPicker} from './document-picker';
import {EASClient} from './eas-client';
import {createFileSystemModule, createLegacyFileSystemModule} from './file-system';
import {createFontLoaderModule} from './font-loader';
import {ExpoHaptics} from './haptics';
import {createImageManipulatorModule} from './image-manipulator';
import {ExponentImagePicker} from './image-picker';
import {ExpoKeepAwake} from './keep-awake';
import {createLinkingModule} from './linking';
import {createLocalizationModule} from './localization';
import {ExpoMailComposer} from './mail-composer';
import {createMediaLibraryModule, createMediaLibraryNextModule} from './media-library';
import {createAppMetricsModule, createObserveModule} from './metrics';
import {createNetworkModule} from './network';
import {createScreenOrientationModule} from './screen-orientation';
import {ExpoSecureStore} from './secure-store';
import {ExpoSharing} from './sharing';
import {ExpoSMS} from './sms';
import {ExpoStoreReview} from './store-review';
import {ExpoSystemUI} from './system-ui';
import {ExpoTrackingTransparency} from './tracking';
import {registerUnavailableModules} from './unavailable';
import {createUpdatesModule} from './updates';
import {ExpoWebBrowser} from './web-browser';
import {ExpoWindows} from './window';

/**
 * Registers every Windows module under the name its Expo package asks
 * `requireNativeModule` for. A module with events is a `NativeModule`
 * subclass, created here from the class the installed global holds; one
 * that is only constants and functions is a plain object. After the real
 * ones comes the table of modules the platform has no implementation of
 * yet, so that every SDK package imports and answers honestly when used.
 * What is asked for optionally — `ExpoGo`, `ExpoSplashScreen`, `ExpoDevMenu`
 * — stays absent, as it is in a bare app on any platform.
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
  registerModule('ExpoApplication', ExpoApplication);
  registerModule('ExpoUpdates', createUpdatesModule());
  registerModule('ExpoMailComposer', ExpoMailComposer);
  registerModule('ExpoScreenOrientation', createScreenOrientationModule());
  registerModule('ExpoStoreReview', ExpoStoreReview);
  registerModule('ExpoTaskManager', ExpoTaskManager);
  registerModule('ExpoBackgroundFetch', ExpoBackgroundFetch);
  registerModule('ExpoBackgroundTask', ExpoBackgroundTask);
  registerModule('ExpoCellular', ExpoCellular);
  registerModule('ExpoTrackingTransparency', ExpoTrackingTransparency);
  registerModule('ExpoSMS', ExpoSMS);
  registerModule('ExpoBrightness', ExpoBrightness);
  registerModule('ExpoAgeRange', ExpoAgeRange);
  registerModule('EASClient', EASClient);
  registerModule('ExpoAppMetrics', createAppMetricsModule());
  registerModule('ExpoObserve', createObserveModule());
  registerModule('ExpoHaptics', ExpoHaptics);
  registerModule('ExpoCalendar', ExpoCalendar);
  registerModule('CalendarNext', CalendarNext);
  registerModule('ExpoContacts', ExpoContacts);
  registerModule('ExpoContactsNext', ExpoContactsNext);
  registerModule('ExpoBlob', createBlobModule());
  registerModule('ExpoCrypto', ExpoCrypto);
  registerModule('ExpoCryptoAES', createCryptoAesModule());
  registerModule('ExpoSecureStore', ExpoSecureStore);
  registerModule('ExpoLocalization', createLocalizationModule());
  registerModule('ExpoNetwork', createNetworkModule());
  registerModule('FileSystem', createFileSystemModule());
  registerModule('ExponentFileSystem', createLegacyFileSystemModule());
  registerModule('ExpoDocumentPicker', ExpoDocumentPicker);
  registerModule('ExponentImagePicker', ExponentImagePicker);
  registerModule('ExpoImageManipulator', createImageManipulatorModule());
  registerModule('ExpoMediaLibrary', createMediaLibraryModule());
  registerModule('ExpoMediaLibraryNext', createMediaLibraryNextModule());
  // The runtime's own: the window, for the kit's stack and any app that asks for it.
  registerModule('ExpoWindows', ExpoWindows);
  registerUnavailableModules();
}
