// @ts-check
/**
 * The Babel transformer `withWindows` installs: Expo's own, with one line
 * prepended to the app's entry for a `windows` bundle — the import of the
 * runtime's install. That is what puts the install in the module graph and
 * runs it before anything the entry imports; Metro's list of modules run
 * before the main module only orders modules that are already in the graph,
 * so it cannot add one. The entry is Expo Router's, Expo's `AppEntry`, or the
 * file the project's `main` names (`withWindows` passes it in the
 * environment, which Metro's transform workers inherit), whichever the
 * bundle starts from.
 */
const path = require('node:path');

const INSTALL = 'expo-windows/src/install';
const ENTRIES = [/(^|[\\/])node_modules[\\/]expo-router[\\/]entry\.js$/, /(^|[\\/])node_modules[\\/]expo[\\/]AppEntry\.js$/];

/** @typedef {{transform(args: any): Promise<any>; getCacheKey?(): string}} Upstream */

/** @type {Upstream | null} */
let upstreamModule = null;

/** @returns {Upstream} */
function upstream() {
  if (!upstreamModule) {
    upstreamModule = /** @type {Upstream} */ (require(process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER || '@expo/metro-config/babel-transformer'));
  }
  return upstreamModule;
}

/**
 * Whether `filename` — relative to the project root, as Metro hands it to a
 * transformer — is a bundle entry: one of the known entries, or the
 * project's own main file.
 * @param {string} filename
 * @param {string | undefined} main The project's main file, absolute.
 * @param {string} [projectRoot]
 */
function isEntry(filename, main, projectRoot = '') {
  const normalized = path.normalize(filename);
  if (ENTRIES.some(pattern => pattern.test(normalized))) return true;
  return !!main && path.resolve(projectRoot, normalized) === path.resolve(main);
}

/**
 * The source with the install imported first, for a Windows entry; the source as it is otherwise.
 * @param {string} src
 * @param {string} filename
 * @param {string | null | undefined} platform
 * @param {string | undefined} main
 * @param {string} [projectRoot]
 */
function withInstall(src, filename, platform, main, projectRoot) {
  return platform === 'windows' && isEntry(filename, main, projectRoot) ? `import '${INSTALL}';\n${src}` : src;
}

/** @param {{src: string; filename: string; options: {platform?: string | null; projectRoot?: string}}} args */
async function transform(args) {
  const src = withInstall(args.src, args.filename, args.options.platform, process.env.EXPO_WINDOWS_ENTRY, args.options.projectRoot);
  return upstream().transform(src === args.src ? args : {...args, src});
}

function getCacheKey() {
  const key = upstream().getCacheKey?.() ?? '';
  return `${key}:expo-windows:${process.env.EXPO_WINDOWS_ENTRY ?? ''}`;
}

module.exports = {transform, getCacheKey, withInstall, isEntry, INSTALL};
