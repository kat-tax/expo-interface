/**
 * React Native CLI configuration for the kit as a dependency.
 *
 * Windows: tells react-native-windows' autolinking where the kit's library
 * is (`windows/ExpoInterface`), so an app that depends on `expo-interface`
 * builds and registers it — its package provider, and with it every
 * `ExpoInterface*` XAML-hosted component — without a manual step. The
 * library's `codegenConfig` (package.json) is run by the same build.
 *
 * iOS and Android: `null`, which is "no native code here". The kit's native
 * code on those platforms is `@expo/ui`'s, and without this React Native's
 * codegen would read the Windows specs on every platform and generate
 * component descriptors nothing implements.
 */
module.exports = {
  dependency: {
    platforms: {
      ios: null,
      android: null,
      windows: {
        sourceDir: 'windows',
        solutionFile: 'ExpoInterface.sln',
        projects: [
          {
            projectFile: 'ExpoInterface\\ExpoInterface.vcxproj',
            directDependency: true,
          },
        ],
      },
    },
  },
};
