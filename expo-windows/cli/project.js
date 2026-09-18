// @ts-check
/**
 * The `windows/` project on disk: finding the one react-native-windows
 * generated and applying the runtime's patches to it.
 */
const fs = require('node:fs');
const path = require('node:path');
const {patchAppCpp, patchExperimentalFeatures, patchSingleInstance, patchSmoke, patchVcxproj} = require('./patch');

/**
 * The generated project: the folder under `windows/` that holds a
 * `.vcxproj`, with the app's C++ entry next to it. `null` when there is no
 * `windows/` folder or no project in it.
 * @param {string} projectRoot
 * @returns {{name: string; dir: string; vcxproj: string; appCpp: string | null} | null}
 */
function findProject(projectRoot) {
  const windows = path.join(projectRoot, 'windows');
  if (!fs.existsSync(windows)) return null;
  for (const entry of fs.readdirSync(windows, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(windows, entry.name);
    const vcxproj = fs.readdirSync(dir).find(file => file.endsWith('.vcxproj'));
    if (!vcxproj) continue;
    const name = vcxproj.slice(0, -'.vcxproj'.length);
    const appCpp = [`${name}.cpp`, 'App.cpp'].map(file => path.join(dir, file)).find(file => fs.existsSync(file)) ?? null;
    return {name, dir, vcxproj: path.join(dir, vcxproj), appCpp};
  }
  return null;
}

/**
 * Applies the runtime's patches to the generated project — the project
 * file, the C++ entry, and `windows/ExperimentalFeatures.props` for the
 * library projects that read it — and says what changed. Safe to run
 * again: a patched file is left as it is.
 * @param {string} projectRoot
 * @returns {{name: string; changed: string[]}}
 */
function applyPatches(projectRoot) {
  const project = findProject(projectRoot);
  if (!project) throw new Error(`No react-native-windows project under ${path.join(projectRoot, 'windows')}`);
  const changed = [];
  const features = path.join(projectRoot, 'windows', 'ExperimentalFeatures.props');
  const files = [
    [project.vcxproj, patchVcxproj],
    ...(project.appCpp ? [[project.appCpp, (/** @type {string} */ text) => patchSmoke(patchSingleInstance(patchAppCpp(text)))]] : []),
    ...(fs.existsSync(features) ? [[features, patchExperimentalFeatures]] : []),
  ];
  for (const [file, patch] of /** @type {[string, (text: string) => string][]} */ (files)) {
    const before = fs.readFileSync(file, 'utf8');
    const after = patch(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed.push(path.relative(projectRoot, file));
    }
  }
  return {name: project.name, changed};
}

const METRO_CONFIG = `// Expo's Metro config with the Windows runtime applied: the platform, the
// react-native-windows redirection and the runtime's install before the entry.
const {getDefaultConfig} = require('expo/metro-config');
const {withWindows} = require('expo-windows/metro');

module.exports = withWindows(getDefaultConfig(__dirname));
`;

/**
 * Keeps the app's \`metro.config.js\` through \`init-windows\`, which writes
 * react-native-windows' own over it — a config without Expo or the runtime,
 * under which the Windows bundle fails on React Native's platform files. The
 * returned function, called after \`init-windows\`, puts the app's back, or
 * writes one that applies \`withWindows\` when the app had none.
 * @param {string} projectRoot
 * @returns {() => 'kept' | 'restored' | 'written'}
 */
function keepMetroConfig(projectRoot) {
  const file = path.join(projectRoot, 'metro.config.js');
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  return () => {
    const after = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before === null) {
      if (after !== null && after.includes('expo-windows/metro')) return 'kept';
      fs.writeFileSync(file, METRO_CONFIG);
      return 'written';
    }
    if (after === before) return 'kept';
    fs.writeFileSync(file, before);
    return 'restored';
  };
}

const SCREENS_EXCLUSION = `// react-native-screens and @react-native-community/netinfo ship Windows
// projects from the Paper days that do not build in a New Architecture app,
// and Windows does not use them: Expo Router's screens are plain views and
// expo-interface's Stack draws its own header, and expo-windows answers
// netinfo's API from its own network library. Keep both out of
// react-native-windows' autolinking.
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
`;

/**
 * Writes the app's `react-native.config.js` with react-native-screens and
 * netinfo kept out of Windows autolinking, when the app has none. An
 * existing file is left alone and named, so the exclusions can be added by
 * hand.
 * @param {string} projectRoot
 * @returns {'written' | 'kept'}
 */
function ensureScreensExclusion(projectRoot) {
  const file = path.join(projectRoot, 'react-native.config.js');
  if (fs.existsSync(file)) return 'kept';
  fs.writeFileSync(file, SCREENS_EXCLUSION);
  return 'written';
}

module.exports = {findProject, applyPatches, ensureScreensExclusion, keepMetroConfig, SCREENS_EXCLUSION, METRO_CONFIG};
