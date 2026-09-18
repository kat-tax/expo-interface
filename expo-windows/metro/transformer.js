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

/**
 * The modules Expo runs before the entry (`expo/src/winter`,
 * `@expo/metro-runtime`), which reach Expo Modules Core and so need the
 * install before them as well. `withWindows` lists the install ahead of them
 * in Metro's run-before-main order, but that list reaches a bundle only
 * through the serializer that asks for it — Expo's export serializer held
 * on to the one it was given before `withWindows` ran, once — and only for
 * a path spelled as the graph keys it. Importing the install from these
 * files holds whatever the list does.
 */
const PRELUDES = [/(^|[\\/])node_modules[\\/]expo[\\/](src|build)[\\/]winter[\\/]index\.[jt]s$/, /(^|[\\/])node_modules[\\/]@expo[\\/]metro-runtime[\\/](src|build)[\\/]index\.[jt]s$/];

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
 * Whether `filename` is one of the modules Expo runs before the entry.
 * @param {string} filename
 */
function isPrelude(filename) {
  const normalized = path.normalize(filename);
  return PRELUDES.some(pattern => pattern.test(normalized));
}

/**
 * The source with the install imported first, for a Windows entry or one of Expo's preludes; the source as it is otherwise.
 * @param {string} src
 * @param {string} filename
 * @param {string | null | undefined} platform
 * @param {string | undefined} main
 * @param {string} [projectRoot]
 */
function withInstall(src, filename, platform, main, projectRoot) {
  return platform === 'windows' && (isEntry(filename, main, projectRoot) || isPrelude(filename)) ? `import '${INSTALL}';\n${src}` : src;
}

/** The runtime module that reads the embedded app config. */
const CONFIG_READER = /(^|[\\/])expo-windows[\\/]src[\\/]modules[\\/]constants\.ts$/;
const CONFIG_VARIABLE = 'EXPO_PUBLIC_WINDOWS_APP_CONFIG';

/**
 * The source of the runtime's constants module with the app config written
 * in for a Windows bundle. `withWindows` puts the config in the
 * `EXPO_PUBLIC_WINDOWS_APP_CONFIG` variable; babel-preset-expo inlines
 * `EXPO_PUBLIC_` variables into an app's own files in a production build and
 * leaves files under `node_modules` alone (the dev server hands every such
 * variable to the bundle at run time instead), so a Release build read
 * nothing there. The transformer writes the value in itself, in every mode.
 * @param {string} src
 * @param {string} filename
 * @param {string | null | undefined} platform
 * @param {string | undefined} [value] the config JSON; the environment's by default
 */
function withAppConfig(src, filename, platform, value = process.env[CONFIG_VARIABLE]) {
  if (platform !== 'windows' || value === undefined || !CONFIG_READER.test(path.normalize(filename))) return src;
  return src.split(`process.env.${CONFIG_VARIABLE}`).join(JSON.stringify(value));
}

/** Expo's DOM component base: where a `'use dom'` component's page is loaded from. */
const DOM_BASE_READER = /(^|[\\/])expo[\\/](src|build)[\\/]dom[\\/]base\.[jt]s$/;
/**
 * The origin the WebView2 island serves the exported DOM pages from: a
 * virtual host over `Bundle\www.bundle` beside the exe, so a page has a
 * secure origin of its own (storage, workers, fetch) rather than `file:`.
 */
const DOM_BASE_URL = 'https://expo-dom.bundle';

/**
 * Points Expo's DOM components at the island's virtual host on Windows.
 * In production Expo reads `process.env.EXPO_BASE_URL` for a platform that
 * is not Android or iOS, which babel-preset-expo inlines as the web base
 * URL (empty for a native export); the literal is written in before Babel
 * sees it. In development the dev server's URL is used as on every
 * platform, so this only matters to an exported bundle.
 * @param {string} src
 * @param {string} filename
 * @param {string | null | undefined} platform
 */
function withDomBase(src, filename, platform) {
  if (platform !== 'windows' || !DOM_BASE_READER.test(path.normalize(filename))) return src;
  return src.split('process.env.EXPO_BASE_URL').join(JSON.stringify(DOM_BASE_URL));
}

/** @param {{src: string; filename: string; options: {platform?: string | null; projectRoot?: string}}} args */
async function transform(args) {
  const installed = withInstall(args.src, args.filename, args.options.platform, process.env.EXPO_WINDOWS_ENTRY, args.options.projectRoot);
  const src = withDomBase(withAppConfig(installed, args.filename, args.options.platform), args.filename, args.options.platform);
  return upstream().transform(src === args.src ? args : {...args, src});
}

function getCacheKey() {
  const key = upstream().getCacheKey?.() ?? '';
  return `${key}:expo-windows:${process.env.EXPO_WINDOWS_ENTRY ?? ''}:${process.env[CONFIG_VARIABLE] ?? ''}`;
}

module.exports = {transform, getCacheKey, withInstall, withAppConfig, withDomBase, isEntry, isPrelude, INSTALL, DOM_BASE_URL};
