// @ts-check
/**
 * The Windows JavaScript bundle through Expo's exporter, on `expo-windows
 * bundle`'s own arguments or on the ones react-native-windows' MSBuild
 * bundle target passes its bundle command in a Release build, which are the
 * React Native CLI's:
 *
 *     --platform windows --entry-file index.js --bundle-output <file>
 *     --assets-dest <dir> --dev false --reset-cache --sourcemap-output <file>
 *     --minify false
 *
 * `expo export:embed` takes the same options, so they pass through — except
 * the entry file: an Expo app's entry is its package's `main` (Expo Router's
 * `expo-router/entry`), which the exporter resolves itself, and the target
 * names `index.js` whether or not the app has one. The platform is always
 * windows, and the bundle is not minified when the target says so: the
 * target compiles it to Hermes bytecode next.
 */
const fs = require('node:fs');
const path = require('node:path');

/** The options with a value that `expo export:embed` takes as they are. */
const PASSTHROUGH = new Set(['--bundle-output', '--assets-dest', '--sourcemap-output', '--minify']);

/** The flags without a value that it takes as they are. */
const FLAGS = new Set(['--reset-cache']);

/**
 * The arguments after `expo export:embed` for the ones given.
 * @param {string} projectRoot
 * @param {string[]} args
 * @param {{bundleOutput: string; assetsDest: string}} defaults where the bundle and its assets go when the arguments do not say
 * @returns {string[]}
 */
function exportArgs(projectRoot, args, defaults) {
  const options = new Map([
    ['--bundle-output', defaults.bundleOutput],
    ['--assets-dest', defaults.assetsDest],
    ['--dev', 'false'],
  ]);
  const flags = new Set();
  for (let at = 0; at < args.length; at++) {
    const arg = args[at];
    const next = args[at + 1];
    if (arg === '--dev') {
      // `expo-windows bundle --dev` is a development bundle; the target says `--dev false`.
      const named = next !== undefined && !next.startsWith('--');
      options.set(arg, named ? next : 'true');
      if (named) at++;
    } else if (PASSTHROUGH.has(arg)) {
      options.set(arg, next);
      at++;
    } else if (arg === '--entry-file') {
      if (next !== undefined && fs.existsSync(path.resolve(projectRoot, next))) options.set(arg, next);
      at++;
    } else if (FLAGS.has(arg)) {
      flags.add(arg);
    } else if (arg === '--platform') {
      at++;
    }
  }
  return ['--platform', 'windows', ...[...options].flat(), ...flags];
}

module.exports = {exportArgs};
