// @ts-check
/**
 * `withWindows(config)`: makes an Expo app's Metro config serve the
 * `windows` platform. Applied in `metro.config.js` over `expo/metro-config`:
 *
 *     const {getDefaultConfig} = require('expo/metro-config');
 *     const {withWindows} = require('expo-windows/metro');
 *     module.exports = withWindows(getDefaultConfig(__dirname));
 *
 * For a `windows` bundle it: adds the platform to the resolver; redirects
 * `react-native` and `react-native/…` to `react-native-windows`, which is
 * what react-native-windows' own `react-native start` does and `expo start`
 * does not; resolves the packages that have no Windows implementation to the
 * runtime's own files (`expo-image`, `expo-glass-effect`, `expo-symbols`,
 * `expo-blur`, and the web views `@expo/dom-webview` and `react-native-webview`);
 * replaces `expo`'s `fetch`, a native module elsewhere, with React Native's;
 * runs `expo-windows/src/install` before everything else in the bundle,
 * which installs Expo Modules Core's global and the Windows modules; embeds
 * the public app config for `expo-constants`; and keeps Metro out of the
 * `windows/` build folder. Other platforms are untouched.
 *
 * A package can stand in for others on Windows as well, which is how a UI
 * kit answers for `@expo/ui` and the community controls: those are drawn
 * with controls, and the runtime has none. It names a table in its own
 * `package.json`, and an app that depends on it needs no setup:
 *
 *     "expo-windows": {"aliases": "./windows-aliases.json"}
 *
 * The table is JSON, a module name to a file beside it:
 * `{"@expo/ui": "./src/expo-ui.tsx"}`. See `contributedAliases`.
 */
const fs = require('node:fs');
const path = require('node:path');

const WINDOWS = 'windows';

/** Packages resolved to the runtime's own implementation on Windows. */
const ALIASES = {
  'expo-image': path.join(__dirname, '..', 'src', 'aliases', 'expo-image.tsx'),
  'expo-glass-effect': path.join(__dirname, '..', 'src', 'aliases', 'expo-glass-effect.tsx'),
  'expo-symbols': path.join(__dirname, '..', 'src', 'aliases', 'expo-symbols.tsx'),
  // Its Windows project is from the Paper days; the runtime's network library answers instead.
  '@react-native-community/netinfo': path.join(__dirname, '..', 'src', 'aliases', 'netinfo.ts'),
  'expo-blur': path.join(__dirname, '..', 'src', 'aliases', 'expo-effects.tsx'),
  'expo-mesh-gradient': path.join(__dirname, '..', 'src', 'aliases', 'expo-effects.tsx'),
  '@expo/dom-webview': path.join(__dirname, '..', 'src', 'aliases', 'expo-dom-webview.tsx'),
  'react-native-webview': path.join(__dirname, '..', 'src', 'aliases', 'react-native-webview.tsx'),
};

/**
 * Files replaced by the runtime's own on Windows: `expo`'s fetch, a native
 * module elsewhere, is React Native's fetch here (`src/winter-fetch.ts`).
 * @type {[RegExp, string][]}
 */
const REPLACEMENTS = [
  [/[\\/]expo[\\/](src|build)[\\/]winter[\\/]fetch[\\/]fetch\.(ts|js)$/, path.join(__dirname, '..', 'src', 'winter-fetch.ts')],
  // expo-video's native view: the runtime's island, in place of the adapter of a view manager Windows has none of.
  [/[\\/]expo-video[\\/](src|build)[\\/]NativeVideoView\.(ts|js)$/, path.join(__dirname, '..', 'src', 'aliases', 'expo-video-view.tsx')],
  // expo-camera's native view, and expo-maps' two: the runtime's islands, the same way.
  [/[\\/]expo-camera[\\/](src|build)[\\/]ExpoCamera\.(ts|js)$/, path.join(__dirname, '..', 'src', 'aliases', 'expo-camera-view.tsx')],
  [/[\\/]expo-maps[\\/](src|build)[\\/](google[\\/]GoogleMapsView|apple[\\/]AppleMapsView)\.(tsx|js)$/, path.join(__dirname, '..', 'src', 'aliases', 'expo-maps-view.tsx')],
];

const TRANSFORMER = path.join(__dirname, 'transformer.js');

/** The install as it sits in a Windows module graph: the platform file the transformer's import resolves to. */
const INSTALL_WINDOWS = path.join(__dirname, '..', 'src', 'install.windows.ts');

/**
 * react-native-windows' `InitializeCore`, as the project resolves it, or
 * `undefined` where react-native-windows is not installed.
 * @param {string} projectRoot
 */
function windowsCore(projectRoot) {
  try {
    return require.resolve('react-native-windows/Libraries/Core/InitializeCore', {paths: [projectRoot]});
  } catch {
    return undefined;
  }
}

/**
 * The modules Metro runs before the entry, with the install first — right
 * after react-native-windows' `InitializeCore`, which sets the runtime up.
 * Expo's own list runs `expo/src/winter` and `@expo/metro-runtime` before
 * the entry, and those reach Expo Modules Core, which reads the `expo`
 * global at import: the install has to have run by then. Metro only orders
 * modules already in the graph here (the transformer's import is what puts
 * the install there), and a module absent from a graph — the install's
 * Windows file in an iOS bundle — is skipped, so other platforms are
 * untouched.
 * @param {string} projectRoot
 * @param {((entryFilePath: string) => string[]) | undefined} previous
 * @param {string | undefined} [core] react-native-windows' `InitializeCore`; resolved from the project when not given.
 * @returns {(entryFilePath: string) => string[]}
 */
function runBeforeMain(projectRoot, previous, core = windowsCore(projectRoot)) {
  const installs = installPaths();
  return entryFilePath => {
    const rest = (previous ? previous(entryFilePath) : []).filter(file => file !== core && !installs.includes(file));
    return [...(core ? [core] : []), ...installs, ...rest];
  };
}

/**
 * The install's path as this package sits on disk, and as the file system
 * really has it when those differ (a symlinked workspace, a substituted
 * drive): the list only orders a path spelled as the graph keys the module,
 * and Metro may key it by either. A precaution — the transformer imports the
 * install from Expo's preludes as well, so the order holds when neither
 * matches.
 * @param {(file: string) => string} [realpath]
 */
function installPaths(realpath = file => fs.realpathSync.native(file)) {
  try {
    const real = realpath(INSTALL_WINDOWS);
    return real === INSTALL_WINDOWS ? [INSTALL_WINDOWS] : [INSTALL_WINDOWS, real];
  } catch {
    return [INSTALL_WINDOWS];
  }
}

/**
 * The project's main file, absolute, for the transformer to recognise as an
 * entry — from `package.json`'s `main`, resolved from the project root.
 * `undefined` without one (Expo Router's entry is recognised by name).
 * @param {string} projectRoot
 */
function mainFile(projectRoot) {
  try {
    const {main} = require(path.join(projectRoot, 'package.json'));
    if (typeof main !== 'string' || /^(expo-router\/entry|expo\/AppEntry)/.test(main)) return undefined;
    return require.resolve(path.resolve(projectRoot, main));
  } catch {
    return undefined;
  }
}

/**
 * `react-native` and its subpaths as react-native-windows' — the redirect
 * React Native's community CLI applies for a platform with its own package.
 * @param {string} moduleName
 */
function redirectReactNative(moduleName) {
  if (moduleName === 'react-native') return 'react-native-windows';
  if (moduleName.startsWith('react-native/')) return `react-native-windows/${moduleName.slice('react-native/'.length)}`;
  return moduleName;
}

/**
 * A JSON file's object, or an empty one where it cannot be read.
 * @param {string} file
 * @returns {Record<string, any>}
 */
function readObject(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Where a package is installed, as Node would find it from the project: up
 * through the `node_modules` folders, so a hoisted workspace is found too.
 * Looked for rather than resolved, since a package's `exports` need not list
 * its manifest.
 * @param {string} projectRoot
 * @param {string} name
 * @returns {string | undefined}
 */
function packageFolder(projectRoot, name) {
  let folder = path.resolve(projectRoot);
  for (;;) {
    const candidate = path.join(folder, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(folder);
    if (parent === folder) return undefined;
    folder = parent;
  }
}

/**
 * The aliases the project's dependencies contribute. A dependency whose
 * `package.json` carries `"expo-windows": {"aliases": "./table.json"}` names
 * a JSON table of module name to file, each file relative to the table. That
 * is how a UI kit answers for `@expo/ui` on Windows without the runtime
 * knowing the kit: the way autolinking finds a native project, by reading the
 * app's dependencies. A table that is named and cannot be read is a packaging
 * fault, and says so.
 * @param {string} projectRoot
 * @returns {Record<string, string>}
 */
function contributedAliases(projectRoot) {
  const manifest = readObject(path.join(projectRoot, 'package.json'));
  /** @type {Record<string, string>} */
  const aliases = {};
  for (const name of Object.keys({...manifest.dependencies, ...manifest.devDependencies})) {
    const folder = packageFolder(projectRoot, name);
    const declared = folder && readObject(path.join(folder, 'package.json'))['expo-windows']?.aliases;
    if (!folder || typeof declared !== 'string') continue;
    const table = path.resolve(folder, declared);
    /** @type {Record<string, string>} */
    let entries;
    try {
      entries = JSON.parse(fs.readFileSync(table, 'utf8'));
    } catch (error) {
      throw new Error(`${name} names ${declared} as its Windows aliases, which cannot be read: ${/** @type {Error} */ (error).message}`);
    }
    for (const [moduleName, file] of Object.entries(entries)) aliases[moduleName] = path.resolve(path.dirname(table), file);
  }
  return aliases;
}

/**
 * The resolution a Windows bundle gets, over the resolver already configured.
 * @param {Parameters<import('metro-resolver').CustomResolver>[0]} context
 * @param {string} moduleName
 * @param {string | null} platform
 * @param {import('metro-resolver').CustomResolver | undefined} previous
 * @param {Record<string, string>} [aliases] the runtime's own, unless `withWindows` gathered more.
 * @returns {import('metro-resolver').Resolution}
 */
function resolveWindows(context, moduleName, platform, previous, aliases = ALIASES) {
  const resolve = previous ?? context.resolveRequest;
  if (platform !== WINDOWS) return resolve(context, moduleName, platform);
  // Its own entries only: a module called `constructor` is not an alias.
  if (Object.hasOwn(aliases, moduleName)) return {type: 'sourceFile', filePath: aliases[moduleName]};
  const name = redirectReactNative(moduleName);
  let resolution;
  try {
    resolution = resolve(context, name, platform);
  } catch (error) {
    // A file that exists only per platform, with no windows or native
    // variant — react-native-screens' tabs, say — resolves as web, the
    // platform whose variant is the drawn one; failing that, the error
    // names the windows request as it should.
    try {
      resolution = resolve(context, name, 'web');
    } catch {
      throw error;
    }
  }
  if (resolution.type === 'sourceFile') {
    const replacement = REPLACEMENTS.find(([pattern]) => pattern.test(resolution.filePath));
    if (replacement) return {type: 'sourceFile', filePath: replacement[1]};
  }
  return resolution;
}

/**
 * The project's public app config as JSON, for `expo-constants` — `null`
 * when `expo/config` cannot read one (no `app.json`, or `expo` not
 * installed), in which case `Constants.expoConfig` is `null` too.
 * @param {string} projectRoot
 * @returns {string | null}
 */
function readPublicAppConfig(projectRoot) {
  try {
    /** @type {{getConfig(root: string, options: object): {exp: object}}} */
    const {getConfig} = require('expo/config');
    const {exp} = getConfig(projectRoot, {isPublicConfig: true, skipSDKVersionRequirement: true});
    return JSON.stringify(exp);
  } catch {
    return null;
  }
}

/**
 * @template {import('metro-config').InputConfigT} T
 * @param {T} config
 * @param {{projectRoot?: string; appConfig?: boolean; aliases?: Record<string, string>}} [options] `appConfig: false` leaves `expo-constants` without a config; `aliases` are module names to absolute files, over everything else.
 * @returns {T}
 */
function withWindows(config, options = {}) {
  const projectRoot = options.projectRoot ?? config.projectRoot ?? process.cwd();
  const resolver = config.resolver ?? {};
  const transformer = config.transformer ?? {};
  const serializer = config.serializer ?? {};
  const previousResolve = resolver.resolveRequest ?? undefined;
  const windowsFolder = path.resolve(projectRoot, 'windows').replace(/[/\\]/g, '/');
  // What the app's dependencies contribute, under the runtime's own, under what the app says itself.
  const aliases = {...contributedAliases(projectRoot), ...ALIASES, ...options.aliases};

  // The transformer runs in Metro's workers, which inherit this environment:
  // the transformer it wraps, and the entry it prepends the install to.
  if (transformer.babelTransformerPath && transformer.babelTransformerPath !== TRANSFORMER) {
    process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER = transformer.babelTransformerPath;
  }
  const main = mainFile(projectRoot);
  if (main) process.env.EXPO_WINDOWS_ENTRY = main;
  const blockList = [
    ...(Array.isArray(resolver.blockList) ? resolver.blockList : resolver.blockList ? [resolver.blockList] : []),
    new RegExp(`^${windowsFolder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*`),
    /.*\.ProjectImports\.zip$/,
  ];

  if (options.appConfig !== false && !process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG) {
    const appConfig = readPublicAppConfig(projectRoot);
    if (appConfig) process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = appConfig;
  }

  // Expo's export serializer keeps the serializer object it was handed when
  // the config was made and reads the run-before-main list from that one,
  // so the wrapped list goes onto it as well as onto the config returned;
  // otherwise a Release bundle runs Expo's preludes without the install.
  const runBefore = runBeforeMain(projectRoot, serializer.getModulesRunBeforeMainModule);
  /** @type {{getModulesRunBeforeMainModule?: typeof runBefore}} */ (serializer).getModulesRunBeforeMainModule = runBefore;

  return {
    ...config,
    resolver: {
      ...resolver,
      platforms: [...new Set([...(resolver.platforms ?? []), WINDOWS])],
      assetExts: [...new Set([...(resolver.assetExts ?? []), 'xml'])],
      blockList,
      resolveRequest: (context, moduleName, platform) => resolveWindows(context, moduleName, platform, previousResolve, aliases),
    },
    transformer: {
      ...transformer,
      babelTransformerPath: TRANSFORMER,
    },
    serializer: {
      ...serializer,
      getModulesRunBeforeMainModule: runBefore,
    },
  };
}

module.exports = {withWindows, redirectReactNative, resolveWindows, contributedAliases, packageFolder, readPublicAppConfig, mainFile, runBeforeMain, installPaths, ALIASES, TRANSFORMER, INSTALL_WINDOWS};
