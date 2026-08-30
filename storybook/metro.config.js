const path = require('path');
const {getDefaultConfig} = require('expo/metro-config');
const {withStorybook} = require('@storybook/react-native/metro/withStorybook');

const root = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);

// Stories live next to the components in `../src`, so watch the repo root and
// resolve `expo-interface` to the package source (mirrors `example/`).
config.watchFolders = [...(config.watchFolders ?? []), root];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-interface': root,
};

if (!config.resolver.assetExts.includes('xml')) {
  config.resolver.assetExts.push('xml');
}

module.exports = withStorybook(config, {
  enabled: true,
  configPath: path.resolve(__dirname, '.rnstorybook'),
});
