const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('xml')) {
  config.resolver.assetExts.push('xml');
}

module.exports = config;
