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
