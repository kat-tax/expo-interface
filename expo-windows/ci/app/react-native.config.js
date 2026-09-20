// react-native-screens ships a Paper-era Windows project (RNScreens62/63/65
// solutions) that does not build against a New Architecture app, and Windows
// does not use its native views: a UI kit draws the stack's header itself and
// Expo Router's screens are plain views. Keep it out of autolinking. So is
// netinfo's project (it imports the UWP library props and drags
// react-native-windows' own project into the build, which then fails on
// PlatformToolsetVersion); the package resolves to the runtime's network
// library instead. What `expo-windows init` writes for an app without a
// config of its own.
module.exports = {
  dependencies: {
    'react-native-screens': {
      platforms: {
        windows: null,
      },
    },
    '@react-native-community/netinfo': {
      platforms: {
        windows: null,
      },
    },
  },
};
