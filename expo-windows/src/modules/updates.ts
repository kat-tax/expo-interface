import type {NativeModule} from 'expo-modules-core';
import {DevSettings} from 'react-native';
import {nativeModuleClass} from './base';

/** What `checkForUpdateAsync` answers when there is no update service. */
export const NO_UPDATE = {isAvailable: false, manifest: undefined, isRollBackToEmbedded: false, reason: 'noUpdateAvailableOnServer'} as const;

/** What `fetchUpdateAsync` answers when there is nothing to fetch. */
export const NOTHING_FETCHED = {isNew: false, manifest: undefined, isRollBackToEmbedded: false} as const;

export interface ExpoUpdatesModule extends InstanceType<NativeModule> {
  readonly isEnabled: boolean;
  reload(): Promise<void>;
}

/**
 * `ExpoUpdates`, what `expo-updates` reads at import and calls. Windows has
 * no update service: the bundle is the one built into the app (or Metro's),
 * so updates are not enabled — which keeps `expo-asset` and `expo-constants`
 * on their embedded path too — the launch is not an emergency one, nothing
 * is available or fetched, the logs are empty, and `reload` reloads the
 * bundle the way the developer menu does.
 */
export function createUpdatesModule(): ExpoUpdatesModule {
  const Base = nativeModuleClass();
  class Module extends Base implements ExpoUpdatesModule {
    readonly isEmergencyLaunch = false;
    readonly emergencyLaunchReason = null;
    readonly launchDuration = null;
    readonly isEmbeddedLaunch = false;
    readonly isEnabled = false;
    readonly isUsingEmbeddedAssets = false;
    readonly runtimeVersion = '';
    readonly checkAutomatically = 'NEVER';
    readonly channel = '';
    readonly shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = false;
    readonly updateId = undefined;
    readonly commitTime = undefined;
    readonly manifestString = undefined;
    readonly manifest = undefined;
    readonly localAssets = {};
    readonly initialContext = {
      isStartupProcedureRunning: false,
      isUpdateAvailable: false,
      isUpdatePending: false,
      isChecking: false,
      isDownloading: false,
      isRestarting: false,
      restartCount: 0,
      sequenceNumber: 0,
      downloadProgress: 0,
    };

    async reload(): Promise<void> {
      DevSettings.reload();
    }
    async checkForUpdateAsync(): Promise<typeof NO_UPDATE> {
      return NO_UPDATE;
    }
    async getExtraParamsAsync(): Promise<Record<string, string>> {
      return {};
    }
    async setExtraParamAsync(): Promise<void> {}
    async readLogEntriesAsync(): Promise<never[]> {
      return [];
    }
    async clearLogEntriesAsync(): Promise<void> {}
    async fetchUpdateAsync(): Promise<typeof NOTHING_FETCHED> {
      return NOTHING_FETCHED;
    }
    showReloadScreen(): void {}
    hideReloadScreen(): void {}
    setUpdateURLAndRequestHeadersOverride(): void {}
    setUpdateRequestHeadersOverride(): void {}
  }
  return new Module();
}
