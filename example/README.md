# dropfiles (example)

A small file-drop app used as the test bed for [`expo-interface`](../README.md).
Every screen is built from the kit's components, so it doubles as living
documentation for the package.

From the repository root:

```sh
npm install
npm run web      # expo start --web
npm run ios      # expo run:ios
npm run android  # expo run:android
```

The app resolves `expo-interface` straight from `../src` (npm workspace link),
so edits to the package are picked up live.

There is no Windows target here yet: the app is on Expo SDK 57 (React Native
0.86), which has no react-native-windows release to pair with. The kit's
Windows platform is exercised by the Vitest `windows` project, and the
[Windows guide](../storybook/docs/guides/windows.mdx) describes the setup
for an app on an SDK that has one.
