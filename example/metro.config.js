const path = require('path');
const {getDefaultConfig} = require('expo/metro-config');

const root = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);

// Resolve `expo-interface` to the package source at the repo root so the
// example always runs against live edits (bun copies `file:` deps instead of
// symlinking them, so we alias rather than depend on it).
config.watchFolders = [...(config.watchFolders ?? []), root];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-interface': root,
};

if (!config.resolver.assetExts.includes('xml')) {
  config.resolver.assetExts.push('xml');
}

module.exports = config;
