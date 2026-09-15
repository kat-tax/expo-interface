/**
 * `expo/fetch` on Windows: `withWindows` resolves `expo/src/winter/fetch/fetch`
 * to this file. Expo's own `fetch` is a native module (`ExpoFetchModule`)
 * with no Windows implementation, and the web variant reads `globalThis.fetch`
 * at the moment Expo's lazy install is reading it, which is nothing yet.
 * React Native's `fetch`, installed by `InitializeCore` before the runtime's
 * install runs, is what Windows keeps: the install saves it, and this module
 * hands it back in the polyfill's place.
 */
export const fetch: typeof globalThis.fetch = (...args) => {
  const saved = (globalThis as {__expoWindowsFetch?: typeof globalThis.fetch}).__expoWindowsFetch;
  if (!saved) throw new Error('expo-windows: React Native\'s fetch was not saved; install runs first');
  return saved(...args);
};
