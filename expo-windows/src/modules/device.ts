import type {DeviceConstants} from '../native';
import {Platform} from 'react-native';
import {native} from '../native';

/** `expo-device`'s `DeviceType.DESKTOP`. */
const DESKTOP = 3;

/** What the runtime's Windows library reports, or nothing without it. */
function constants(): DeviceConstants {
  return native.device()?.getConstants() ?? {};
}

function osVersion(): string {
  const reported = constants().osVersion;
  if (reported) return reported;
  const version = (Platform.constants as {osVersion?: number | string}).osVersion;
  return version === undefined ? '' : String(version);
}

/**
 * `ExpoDevice`, what `expo-device` reads: a desktop running Windows. With
 * the runtime's Windows library in the app, the machine's name, maker,
 * model, memory, processor and OS build come from it
 * (`EasClientDeviceInformation`, `AnalyticsInfo` and Win32); without it the
 * version is react-native-windows' and the rest is `null`. The Android-only
 * questions (`getMaxMemoryAsync`, side-loading) stay unavailable, as on iOS.
 */
export const ExpoDevice = {
  isDevice: true,
  get brand(): string | null {
    return constants().brand ?? null;
  },
  get manufacturer(): string | null {
    return constants().manufacturer ?? null;
  },
  get modelName(): string | null {
    return constants().modelName ?? null;
  },
  get modelId(): string | null {
    return constants().modelId ?? null;
  },
  get designName(): string | null {
    return constants().designName ?? null;
  },
  get productName(): string | null {
    return constants().productName ?? null;
  },
  deviceYearClass: null,
  get totalMemory(): number | null {
    return constants().totalMemory ?? null;
  },
  get supportedCpuArchitectures(): string[] | null {
    return constants().supportedCpuArchitectures ?? null;
  },
  osName: 'Windows',
  get osVersion(): string {
    return osVersion();
  },
  get osBuildId(): string | null {
    return constants().osBuildId ?? null;
  },
  get osInternalBuildId(): string | null {
    return constants().osBuildId ?? null;
  },
  osBuildFingerprint: null,
  platformApiLevel: null,
  get deviceName(): string | null {
    return constants().deviceName ?? null;
  },
  deviceType: DESKTOP,
  async getDeviceTypeAsync(): Promise<number> {
    return DESKTOP;
  },
  async getUptimeAsync(): Promise<number | null> {
    return (await native.device()?.getUptime()) ?? null;
  },
  async isRootedExperimentalAsync(): Promise<boolean> {
    return false;
  },
};
