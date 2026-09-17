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
 * `@expo/ui`, and the web views `@expo/dom-webview` and `react-native-webview`);
 * replaces `expo`'s `fetch`, a native module elsewhere, with React Native's;
 * runs `expo-windows/src/install` before everything else in the bundle,
 * which installs Expo Modules Core's global and the Windows modules; embeds
 * the public app config for `expo-constants`; and keeps Metro out of the
 * `windows/` build folder. Other platforms are untouched.
 */
const path = require('node:path');

const WINDOWS = 'windows';

/** Packages resolved to the runtime's own implementation on Windows. */
const ALIASES = {
  'expo-image': path.join(__dirname, '..', 'src', 'aliases', 'expo-image.tsx'),
  'expo-glass-effect': path.join(__dirname, '..', 'src', 'aliases', 'expo-glass-effect.tsx'),
  'expo-symbols': path.join(__dirname, '..', 'src', 'aliases', 'expo-symbols.tsx'),
  '@expo/ui': path.join(__dirname, '..', 'src', 'aliases', 'expo-ui.tsx'),
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
  return entryFilePath => {
    const rest = (previous ? previous(entryFilePath) : []).filter(file => file !== core && file !== INSTALL_WINDOWS);
    return [...(core ? [core] : []), INSTALL_WINDOWS, ...rest];
  };
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
 * The resolution a Windows bundle gets, over the resolver already configured.
 * @param {Parameters<import('metro-resolver').CustomResolver>[0]} context
 * @param {string} moduleName
 * @param {string | null} platform
 * @param {import('metro-resolver').CustomResolver | undefined} previous
 * @returns {import('metro-resolver').Resolution}
 */
function resolveWindows(context, moduleName, platform, previous) {
  const resolve = previous ?? context.resolveRequest;
  if (platform !== WINDOWS) return resolve(context, moduleName, platform);
  const alias = ALIASES[/** @type {keyof typeof ALIASES} */ (moduleName)];
  if (alias) return {type: 'sourceFile', filePath: alias};
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
 * @param {{projectRoot?: string; appConfig?: boolean}} [options] `appConfig: false` leaves `expo-constants` without a config.
 * @returns {T}
 */
function withWindows(config, options = {}) {
  const projectRoot = options.projectRoot ?? config.projectRoot ?? process.cwd();
  const resolver = config.resolver ?? {};
  const transformer = config.transformer ?? {};
  const serializer = config.serializer ?? {};
  const previousResolve = resolver.resolveRequest ?? undefined;
  const windowsFolder = path.resolve(projectRoot, 'windows').replace(/[/\\]/g, '/');

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

  return {
    ...config,
    resolver: {
      ...resolver,
      platforms: [...new Set([...(resolver.platforms ?? []), WINDOWS])],
      assetExts: [...new Set([...(resolver.assetExts ?? []), 'xml'])],
      blockList,
      resolveRequest: (context, moduleName, platform) => resolveWindows(context, moduleName, platform, previousResolve),
    },
    transformer: {
      ...transformer,
      babelTransformerPath: TRANSFORMER,
    },
    serializer: {
      ...serializer,
      getModulesRunBeforeMainModule: runBeforeMain(projectRoot, serializer.getModulesRunBeforeMainModule),
    },
  };
}

module.exports = {withWindows, redirectReactNative, resolveWindows, readPublicAppConfig, mainFile, runBeforeMain, ALIASES, TRANSFORMER, INSTALL_WINDOWS};
