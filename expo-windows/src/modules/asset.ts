/**
 * `ExpoAsset`, what `expo-asset` downloads through. Windows answers as web
 * does: the asset's URL is its local URI, since a bundled asset is served by
 * Metro in development and packaged next to the app in release, and React
 * Native loads either directly. A cached copy on disk, which fonts will need
 * to be registered from, is the C++ module's job in a later release.
 */
export const ExpoAsset = {
  async downloadAsync(url: string, _md5Hash: string | null, _type: string): Promise<string> {
    return url;
  },
};
