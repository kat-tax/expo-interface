/**
 * React Native CLI configuration for the runtime as a dependency.
 *
 * Windows: tells react-native-windows' autolinking where the runtime's
 * library is (`windows/ExpoWindows`), so an app that depends on
 * `expo-windows` builds and registers it — its package provider, and with
 * it the modules the Expo packages call on Windows (the window, the device,
 * the clipboard, sharing, linking, fonts) — without a manual step.
 *
 * iOS and Android: `null`, which is "no native code here"; the runtime is
 * Windows only.
 */
module.exports = {
  dependency: {
    platforms: {
      ios: null,
      android: null,
      windows: {
        sourceDir: 'windows',
        solutionFile: 'ExpoWindows.sln',
        projects: [
          {
            projectFile: 'ExpoWindows\\ExpoWindows.vcxproj',
            directDependency: true,
          },
        ],
      },
    },
  },
};
