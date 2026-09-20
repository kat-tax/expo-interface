# dropfiles (example)

A small file-drop app used as the test bed for [`expo-interface`](../README.md).
Every screen is built from the kit's components, so it doubles as living
documentation for the package.

From the repository root:

```sh
bun install
bun run web      # expo start --web
bun run ios      # expo run:ios
bun run android  # expo run:android
```

The app resolves `expo-interface` straight from `../src` (see
`metro.config.js`), so edits to the package are picked up live.

There is no `windows/` folder here. The app is on Expo SDK 57 (React Native
0.86), which has no react-native-windows release to pair with, and neither the
example nor `expo-windows` may depend on react-native-windows. Instead
`scripts/windows-ci.sh` builds this app's source in a scratch app on the
react-native-windows line that ships (0.84), with `expo-windows` writing the
Windows project, which is what the Windows workflow runs. See
[the expo-windows document](../expo-windows/docs/expo-windows.md).
