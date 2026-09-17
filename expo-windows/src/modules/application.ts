import {readAppConfig} from './constants';

/**
 * `ExpoApplication`, what `expo-application` reads. An unpackaged Windows
 * app has no package identity, so what the platform can answer comes from
 * the embedded config: the name and the version the project declares. The
 * members that are not here — the Android id, the install referrer, the iOS
 * vendor id, the release type, the push environment, the install and update
 * times — the package reports unavailable itself, as it does on web.
 */
export const ExpoApplication = {
  get applicationName(): string | null {
    const name = readAppConfig()?.name;
    return typeof name === 'string' ? name : null;
  },
  get applicationId(): null {
    return null;
  },
  get nativeApplicationVersion(): string | null {
    const version = readAppConfig()?.version;
    return typeof version === 'string' ? version : null;
  },
  get nativeBuildVersion(): null {
    return null;
  },
  get androidId(): null {
    return null;
  },
};
