// The Windows platform on the iOS engine: the platform told it is Windows,
// with `.windows.*` files resolved first by the project's resolver plugin
// (`../windows-resolution.ts`).
//
// react-native-windows has no test renderer of its own and vitest-native runs
// iOS or Android only, so React Native's own JavaScript is the iOS build here;
// what the code under test branches on says Windows: `Platform.OS`,
// `Platform.select`, `EXPO_OS` and the platform file resolution. A native
// component renders as a host view named after it, whose props are the payload
// handed to the native side, which is what a test asserts on
// (`expo-vitest/windows`).
import {Platform} from 'react-native';

process.env.EXPO_OS = 'windows';

Object.defineProperty(Platform, 'OS', {value: 'windows', configurable: true, writable: true});

Platform.select = (spec: Record<string, unknown>) =>
  'windows' in spec ? spec.windows : 'native' in spec ? spec.native : spec.default;
