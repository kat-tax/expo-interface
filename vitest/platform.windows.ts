// The Windows platform on the iOS engine (see vitest.config.mts): the
// platform told it is Windows, and `.windows.*` files resolved first.
//
// react-native-windows has no test renderer of its own and vitest-native runs
// iOS or Android only, so React Native's own JavaScript is the iOS build here;
// what the kit branches on — `Platform.OS`, `Platform.select`, `EXPO_OS` and
// the platform file resolution — says Windows. The XAML islands render as host
// views named after their native components (`ExpoInterfaceButton`, ...) whose
// props are the payload handed to the C++ side, which is what the tests assert
// on. The kit's project adds the forbidden-module guard (`setup.windows.ts`);
// the runtime's project stops here, since it imports the Expo packages to
// prove they load on Windows.
import {Platform} from 'react-native';

process.env.EXPO_OS = 'windows';

Object.defineProperty(Platform, 'OS', {value: 'windows', configurable: true, writable: true});

Platform.select = (spec: Record<string, unknown>) =>
  'windows' in spec ? spec.windows : 'native' in spec ? spec.native : spec.default;
