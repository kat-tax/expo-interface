import {Platform} from 'react-native';

/** `expo-device`'s `DeviceType.DESKTOP`. */
const DESKTOP = 3;

function osVersion(): string {
  const version = (Platform.constants as {osVersion?: number | string}).osVersion;
  return version === undefined ? '' : String(version);
}

/**
 * `ExpoDevice`, what `expo-device` reads: a desktop running Windows, at the
 * version react-native-windows reports, and nothing the platform does not
 * give JavaScript — the model, the maker, the memory and the uptime come
 * from `EasClientDeviceInformation` and `SystemInformation` in a later C++
 * module, and are `null` until then. The Android-only questions
 * (`getMaxMemoryAsync`, side-loading) stay unavailable, as on iOS.
 */
export const ExpoDevice = {
  isDevice: true,
  brand: null,
  manufacturer: null,
  modelName: null,
  modelId: null,
  designName: null,
  productName: null,
  deviceYearClass: null,
  totalMemory: null,
  supportedCpuArchitectures: null,
  osName: 'Windows',
  get osVersion(): string {
    return osVersion();
  },
  osBuildId: null,
  osInternalBuildId: null,
  osBuildFingerprint: null,
  platformApiLevel: null,
  deviceName: null,
  deviceType: DESKTOP,
  async getDeviceTypeAsync(): Promise<number> {
    return DESKTOP;
  },
  async getUptimeAsync(): Promise<number | null> {
    return null;
  },
  async isRootedExperimentalAsync(): Promise<boolean> {
    return false;
  },
};
