import {DevSettings} from 'react-native';
import {createUpdatesModule, NO_UPDATE, NOTHING_FETCHED} from './updates';

describe('ExpoUpdates (windows)', () => {
  it('is not enabled, launched from the built-in bundle, with nothing to check, fetch or log', async () => {
    const updates = createUpdatesModule() as ReturnType<typeof createUpdatesModule> & Record<string, unknown>;
    expect(updates).toMatchObject({
      isEnabled: false,
      isEmergencyLaunch: false,
      emergencyLaunchReason: null,
      launchDuration: null,
      isEmbeddedLaunch: false,
      isUsingEmbeddedAssets: false,
      runtimeVersion: '',
      checkAutomatically: 'NEVER',
      channel: '',
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: false,
      localAssets: {},
      initialContext: {isUpdateAvailable: false, isUpdatePending: false, isChecking: false, isDownloading: false, isRestarting: false, restartCount: 0, sequenceNumber: 0, downloadProgress: 0, isStartupProcedureRunning: false},
    });
    expect(updates.updateId).toBeUndefined();
    expect(updates.manifest).toBeUndefined();
    expect(updates.manifestString).toBeUndefined();
    expect(updates.commitTime).toBeUndefined();
    const module = updates as unknown as {
      checkForUpdateAsync(): Promise<unknown>;
      fetchUpdateAsync(): Promise<unknown>;
      getExtraParamsAsync(): Promise<unknown>;
      setExtraParamAsync(): Promise<void>;
      readLogEntriesAsync(): Promise<unknown>;
      clearLogEntriesAsync(): Promise<void>;
      showReloadScreen(): void;
      hideReloadScreen(): void;
      setUpdateURLAndRequestHeadersOverride(): void;
      setUpdateRequestHeadersOverride(): void;
    };
    await expect(module.checkForUpdateAsync()).resolves.toBe(NO_UPDATE);
    expect(NO_UPDATE.reason).toBe('noUpdateAvailableOnServer');
    await expect(module.fetchUpdateAsync()).resolves.toBe(NOTHING_FETCHED);
    await expect(module.getExtraParamsAsync()).resolves.toEqual({});
    await expect(module.setExtraParamAsync()).resolves.toBeUndefined();
    await expect(module.readLogEntriesAsync()).resolves.toEqual([]);
    await expect(module.clearLogEntriesAsync()).resolves.toBeUndefined();
    expect(module.showReloadScreen()).toBeUndefined();
    expect(module.hideReloadScreen()).toBeUndefined();
    expect(module.setUpdateURLAndRequestHeadersOverride()).toBeUndefined();
    expect(module.setUpdateRequestHeadersOverride()).toBeUndefined();
  });

  it('reloads the bundle the way the developer menu does', async () => {
    const reload = vi.spyOn(DevSettings, 'reload').mockImplementation(() => {});
    await createUpdatesModule().reload();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
