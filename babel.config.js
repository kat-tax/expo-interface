// Used by Jest (jest-expo) for the package source; the example and storybook
// apps are bundled by Metro from their own directories with Expo's defaults.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
