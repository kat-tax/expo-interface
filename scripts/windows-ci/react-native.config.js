// react-native-screens ships a Paper-era Windows project (RNScreens62/63/65
// solutions) that does not build against a New Architecture app, and Windows
// does not use its native views: the kit's Stack draws the header itself and
// Expo Router's screens are plain views. Keep it out of autolinking.
module.exports = {
  dependencies: {
    'react-native-screens': {
      platforms: {
        windows: null,
      },
    },
  },
};
