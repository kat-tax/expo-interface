// The harness: an Expo Metro config with the Windows runtime applied, the
// way an app's metro.config.js would, served by `expo start`.
const {getDefaultConfig} = require('expo/metro-config');
const {withWindows} = require('expo-windows/metro');
const fs = require('node:fs');
const path = require('node:path');

const rnwPath = fs.realpathSync(path.resolve(require.resolve('react-native-windows/package.json'), '..'));

const config = withWindows(getDefaultConfig(__dirname));
// react-native-windows' own build folders, which Metro must not crawl.
config.resolver.blockList.push(new RegExp(`${rnwPath.replace(/[/\\]/g, '/')}/build/.*`), new RegExp(`${rnwPath.replace(/[/\\]/g, '/')}/target/.*`));

module.exports = config;
