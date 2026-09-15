// @ts-check
/**
 * The `windows/` project on disk: finding the one react-native-windows
 * generated and applying the runtime's patches to it.
 */
const fs = require('node:fs');
const path = require('node:path');
const {patchAppCpp, patchVcxproj} = require('./patch');

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
 * Applies the runtime's patches to the generated project, and says what
 * changed. Safe to run again: a patched file is left as it is.
 * @param {string} projectRoot
 * @returns {{name: string; changed: string[]}}
 */
function applyPatches(projectRoot) {
  const project = findProject(projectRoot);
  if (!project) throw new Error(`No react-native-windows project under ${path.join(projectRoot, 'windows')}`);
  const changed = [];
  const files = [
    [project.vcxproj, patchVcxproj],
    ...(project.appCpp ? [[project.appCpp, patchAppCpp]] : []),
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

const SCREENS_EXCLUSION = `// react-native-screens ships a Windows project from the Paper days that does
// not build in a New Architecture app, and Windows does not use its native
// views (Expo Router's screens are plain views, and expo-interface's Stack
// draws its own header): keep it out of react-native-windows' autolinking.
module.exports = {
  dependencies: {
    'react-native-screens': {
      platforms: {
        windows: null,
      },
    },
  },
};
`;

/**
 * Writes the app's `react-native.config.js` with react-native-screens kept
 * out of Windows autolinking, when the app has none. An existing file is
 * left alone and named, so the exclusion can be added by hand.
 * @param {string} projectRoot
 * @returns {'written' | 'kept'}
 */
function ensureScreensExclusion(projectRoot) {
  const file = path.join(projectRoot, 'react-native.config.js');
  if (fs.existsSync(file)) return 'kept';
  fs.writeFileSync(file, SCREENS_EXCLUSION);
  return 'written';
}

module.exports = {findProject, applyPatches, ensureScreensExclusion, SCREENS_EXCLUSION};
