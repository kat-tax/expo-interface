// Setup for the Windows project (see vitest.config.mts): the iOS engine with
// the platform told it is Windows, and `.windows.*` files resolved first.
//
// react-native-windows has no test renderer of its own and vitest-native runs
// iOS or Android only, so React Native's own JavaScript is the iOS build here;
// what the kit branches on — `Platform.OS`, `Platform.select`, `EXPO_OS` and
// the platform file resolution — says Windows. The XAML islands render as host
// views named after their native components (`ExpoInterfaceButton`, ...) whose
// props are the payload handed to the C++ side, which is what the tests assert
// on.
import {Platform} from 'react-native';

process.env.EXPO_OS = 'windows';

Object.defineProperty(Platform, 'OS', {value: 'windows', configurable: true, writable: true});

Platform.select = (spec: Record<string, unknown>) =>
  'windows' in spec ? spec.windows : 'native' in spec ? spec.native : spec.default;

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
