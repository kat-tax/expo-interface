import {Platform} from 'react-native';
import {uuidv4} from '../uuid';

/**
 * The app config `withWindows` embeds: it reads the project's public config
 * with `expo/config` and puts it in `process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG`,
 * which babel-preset-expo inlines into the bundle the way it inlines every
 * `EXPO_PUBLIC_` variable — so `Constants.expoConfig` is the same object here
 * as the config plugin embeds in a native app.
 */
export function readAppConfig(): Record<string, unknown> | null {
  const json = process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
  if (!json) return null;
  try {
    const config = JSON.parse(json) as unknown;
    return config && typeof config === 'object' ? (config as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const sessionId = uuidv4();

/** The scheme an app registers, from `expo.scheme` (the first of a list), or `null`. */
export function appScheme(config: Record<string, unknown> | null): string | null {
  const scheme = config?.scheme;
  if (typeof scheme === 'string') return scheme;
  if (Array.isArray(scheme) && typeof scheme[0] === 'string') return scheme[0];
  return null;
}

/**
 * `ExponentConstants`, what `expo-constants` reads: a bare app's constants —
 * no `appOwnership`, the `bare` execution environment, a session id — with
 * the embedded config as `manifest`, which `Constants.expoConfig` is built
 * from, and the Windows version from react-native-windows' platform
 * constants. Windows is not one of the platforms `Constants.platform`
 * names; the OS version is under `systemVersion`.
 */
export const ExponentConstants = {
  get appOwnership(): null {
    return null;
  },
  get executionEnvironment(): 'bare' {
    return 'bare';
  },
  get sessionId(): string {
    return sessionId;
  },
  get isHeadless(): boolean {
    return false;
  },
  get manifest(): Record<string, unknown> | null {
    return readAppConfig();
  },
  get manifest2(): null {
    return null;
  },
  get expoVersion(): string | null {
    const version = readAppConfig()?.sdkVersion;
    return typeof version === 'string' ? version : null;
  },
  get expoRuntimeVersion(): string | null {
    return null;
  },
  get linkingUri(): string {
    const scheme = appScheme(readAppConfig());
    return scheme ? `${scheme}://` : '';
  },
  get experienceUrl(): string {
    return this.linkingUri;
  },
  get deviceName(): string | undefined {
    return undefined;
  },
  get systemVersion(): string | undefined {
    const version = (Platform.constants as {osVersion?: number | string}).osVersion;
    return version === undefined ? undefined : String(version);
  },
  get systemFonts(): string[] {
    return [];
  },
  get statusBarHeight(): number {
    return 0;
  },
  get deviceYearClass(): null {
    return null;
  },
  get debugMode(): boolean {
    return __DEV__;
  },
  async getWebViewUserAgentAsync(): Promise<string | null> {
    return null;
  },
};
