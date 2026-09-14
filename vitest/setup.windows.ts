// Setup for the Windows project (see vitest.config.mts): the iOS engine with
// the platform told it is Windows, and `.windows.*` files resolved first.
//
// react-native-windows has no test renderer of its own and vitest-native runs
// iOS or Android only, so React Native's own JavaScript is the iOS build here;
// what the kit branches on — `Platform.OS`, `Platform.select`, `EXPO_OS` and
// the platform file resolution — says Windows. The XAML islands render as host
// views named after their native components (`ExpoInterfaceButton`, ...) whose
// props are the payload handed to the C++ side, which is what the tests assert
// on. `@expo/ui` must never load: nothing of it exists on Windows.
import {Platform} from 'react-native';

process.env.EXPO_OS = 'windows';

Object.defineProperty(Platform, 'OS', {value: 'windows', configurable: true, writable: true});

Platform.select = (spec: Record<string, unknown>) =>
  'windows' in spec ? spec.windows : 'native' in spec ? spec.native : spec.default;

// `vi.mock` is hoisted above every import, so each factory is written out.
const FORBIDDEN = '@expo/ui has no Windows implementation and must not be imported by a .windows file.';
vi.mock('@expo/ui', () => {
  throw new Error(FORBIDDEN);
});
vi.mock('@expo/ui/swift-ui', () => {
  throw new Error(FORBIDDEN);
});
vi.mock('@expo/ui/swift-ui/modifiers', () => {
  throw new Error(FORBIDDEN);
});
vi.mock('@expo/ui/jetpack-compose', () => {
  throw new Error(FORBIDDEN);
});
vi.mock('@expo/ui/jetpack-compose/modifiers', () => {
  throw new Error(FORBIDDEN);
});
