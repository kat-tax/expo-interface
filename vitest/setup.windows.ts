// Setup for the kit's Windows project (see vitest.config.mts): the platform
// (`platform.windows.ts`) plus the guard below.
import './platform.windows';

// The modules with no Windows implementation must never load: `@expo/ui`
// (nothing of it exists on Windows) and the Expo packages whose module calls
// `requireNativeModule` at import and throws without the native side —
// importing one kills an app before its first render. Type-only imports are
// erased and stay fine. What is not here is what a Windows app does have:
// `expo-router` (the navigation UI) and the modules the `expo-windows`
// runtime provides — `expo-constants` and `expo-linking`, which Expo Router
// itself loads. `src/index.windows.test.ts` imports the whole barrel under
// this rule; `vi.mock` is hoisted above every import, so each is written out.
function forbidden(name: string): () => never {
  return () => {
    throw new Error(`${name} has no Windows implementation and must not be imported by a .windows file.`);
  };
}
vi.mock('@expo/ui', forbidden('@expo/ui'));
vi.mock('@expo/ui/swift-ui', forbidden('@expo/ui/swift-ui'));
vi.mock('@expo/ui/swift-ui/modifiers', forbidden('@expo/ui/swift-ui/modifiers'));
vi.mock('@expo/ui/jetpack-compose', forbidden('@expo/ui/jetpack-compose'));
vi.mock('@expo/ui/jetpack-compose/modifiers', forbidden('@expo/ui/jetpack-compose/modifiers'));
vi.mock('expo-asset', forbidden('expo-asset'));
vi.mock('expo-image', forbidden('expo-image'));
vi.mock('expo-status-bar', forbidden('expo-status-bar'));
vi.mock('expo-symbols', forbidden('expo-symbols'));
vi.mock('expo-symbols/androidWeights/regular', forbidden('expo-symbols/androidWeights/regular'));
vi.mock('expo-system-ui', forbidden('expo-system-ui'));
vi.mock('expo-web-browser', forbidden('expo-web-browser'));
vi.mock('react-native-keyboard-controller', forbidden('react-native-keyboard-controller'));
