// @ts-check
const path = require('node:path');
const {ALIASES, TRANSFORMER, mainFile, readPublicAppConfig, redirectReactNative, resolveWindows, withWindows} = require('./index');

/** The runtime's own folder, and the smallest Expo project there is, for what reads a real one. */
const PACKAGE = path.resolve(__dirname, '..');
const FIXTURE = path.join(PACKAGE, 'fixture');
/** Reading a project's app config through expo/config loads the config module: slow while the whole suite runs. */
const CONFIG_TIMEOUT = 30_000;

/** A resolver that records what it was asked and answers with a source file of that name. */
function fakeContext() {
  const asked = /** @type {string[]} */ ([]);
  const resolveRequest = vi.fn((_context, moduleName) => {
    asked.push(moduleName);
    return {type: /** @type {const} */ ('sourceFile'), filePath: `/node_modules/${moduleName}.js`};
  });
  return {context: /** @type {any} */ ({resolveRequest, originModulePath: '/app/index.js'}), asked};
}

describe('withWindows', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
    delete process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER;
    delete process.env.EXPO_WINDOWS_ENTRY;
  });

  it('adds the platform, the drawable asset extension and the build folder block, keeping what was there', () => {
    const config = withWindows(
      /** @type {any} */ ({
        projectRoot: '/app',
        resolver: {platforms: ['ios', 'android', 'windows'], assetExts: ['png', 'xml'], blockList: /already/},
        transformer: {babelTransformerPath: '/expo/babel-transformer.js', minifierPath: '/m'},
      }),
      {appConfig: false},
    );
    expect(config.resolver.platforms).toEqual(['ios', 'android', 'windows']);
    expect(config.resolver.assetExts).toEqual(['png', 'xml']);
    expect(config.resolver.blockList).toHaveLength(3);
    expect(config.resolver.blockList[0]).toEqual(/already/);
    const build = path.resolve('/app', 'windows', 'x64', 'Debug', 'App.dll').replace(/\\/g, '/');
    expect(config.resolver.blockList[1].test(build)).toBe(true);
    expect(config.resolver.blockList[1].test(path.resolve('/app', 'src', 'index.js').replace(/\\/g, '/'))).toBe(false);
    expect(config.resolver.blockList[2].test('/app/windows/msbuild.ProjectImports.zip')).toBe(true);
    expect(config.transformer).toEqual({babelTransformerPath: TRANSFORMER, minifierPath: '/m'});
    expect(process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER).toBe('/expo/babel-transformer.js');
  });

  it('starts from nothing when the config has no resolver or serializer', () => {
    const config = withWindows(/** @type {any} */ ({}), {projectRoot: '/app', appConfig: false});
    expect(config.resolver.platforms).toEqual(['windows']);
    expect(config.resolver.assetExts).toEqual(['xml']);
    expect(config.resolver.blockList).toHaveLength(2);
    expect(config.transformer.babelTransformerPath).toBe(TRANSFORMER);
  });

  it('embeds the project\'s public app config for expo-constants, unless told not to or already set', () => {
    withWindows(/** @type {any} */ ({}), {projectRoot: FIXTURE});
    const embedded = JSON.parse(process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG ?? 'null');
    expect(embedded).toMatchObject({slug: 'fixture'});
    process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = '{"kept":true}';
    withWindows(/** @type {any} */ ({}), {projectRoot: FIXTURE});
    expect(process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG).toBe('{"kept":true}');
    delete process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
    withWindows(/** @type {any} */ ({}), {projectRoot: '/nowhere', appConfig: false});
    expect(process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG).toBeUndefined();
    withWindows(/** @type {any} */ ({projectRoot: '/nowhere'}));
    expect(process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG).toBeUndefined();
  }, CONFIG_TIMEOUT);

  it('resolves through the wrapper it installs', () => {
    const {context, asked} = fakeContext();
    const config = withWindows(/** @type {any} */ ({resolver: {resolveRequest: context.resolveRequest}}), {projectRoot: '/app', appConfig: false});
    expect(config.resolver.resolveRequest(context, 'react-native', 'windows')).toEqual({type: 'sourceFile', filePath: '/node_modules/react-native-windows.js'});
    expect(asked).toEqual(['react-native-windows']);
  });
});

describe('readPublicAppConfig', () => {
  it('reads a project\'s config and gives null where there is no project', () => {
    expect(JSON.parse(readPublicAppConfig(FIXTURE) ?? 'null')).toMatchObject({slug: 'fixture', scheme: 'fixture'});
    expect(readPublicAppConfig('/nowhere/at/all')).toBeNull();
  }, CONFIG_TIMEOUT);
});

describe('resolveWindows', () => {
  it('leaves other platforms alone', () => {
    const {context, asked} = fakeContext();
    resolveWindows(context, 'react-native', 'ios', undefined);
    resolveWindows(context, 'expo-image', 'web', undefined);
    expect(asked).toEqual(['react-native', 'expo-image']);
  });

  it('redirects react-native and its subpaths to react-native-windows', () => {
    const {context, asked} = fakeContext();
    resolveWindows(context, 'react-native', 'windows', undefined);
    resolveWindows(context, 'react-native/Libraries/Image/AssetRegistry', 'windows', undefined);
    resolveWindows(context, 'react-native-web', 'windows', undefined);
    expect(asked).toEqual(['react-native-windows', 'react-native-windows/Libraries/Image/AssetRegistry', 'react-native-web']);
    expect(redirectReactNative('react-native-screens')).toBe('react-native-screens');
  });

  it('resolves the packages without a Windows implementation to the runtime\'s files', () => {
    const {context, asked} = fakeContext();
    for (const name of Object.keys(ALIASES)) {
      expect(resolveWindows(context, name, 'windows', undefined)).toEqual({type: 'sourceFile', filePath: ALIASES[/** @type {keyof typeof ALIASES} */ (name)]});
    }
    expect(asked).toEqual([]);
  });

  it("replaces expo's fetch, a native module elsewhere, with the runtime's over React Native's", () => {
    const fetchFile = require.resolve('expo/src/winter/fetch/fetch.ts');
    const previous = vi.fn((_context, moduleName) => ({type: /** @type {const} */ ('sourceFile'), filePath: moduleName === 'fetch' ? fetchFile : '/n/expo/src/winter/fetch/other.ts'}));
    const {context} = fakeContext();
    expect(resolveWindows(context, 'fetch', 'windows', previous)).toEqual({type: 'sourceFile', filePath: path.join(__dirname, '..', 'src', 'winter-fetch.ts')});
    expect(resolveWindows(context, 'other', 'windows', previous)).toEqual({type: 'sourceFile', filePath: '/n/expo/src/winter/fetch/other.ts'});
    const empty = vi.fn(() => ({type: /** @type {const} */ ('empty')}));
    expect(resolveWindows(context, 'fetch', 'windows', empty)).toEqual({type: 'empty'});
  });
});

describe('withWindows defaults', () => {
  it('falls back to the working directory as the project root and keeps an array block list', () => {
    const config = withWindows(/** @type {any} */ ({resolver: {blockList: [/one/, /two/]}}), {appConfig: false});
    expect(config.resolver.blockList.slice(0, 2)).toEqual([/one/, /two/]);
    expect(config.resolver.blockList).toHaveLength(4);
    const build = path.resolve(process.cwd(), 'windows', 'x64', 'App.dll').split(path.sep).join('/');
    expect(config.resolver.blockList[2].test(build)).toBe(true);
  });
});

describe('resolveWindows fallback', () => {
  it('resolves as web what has no windows or native variant, and reports the windows failure otherwise', () => {
    const {context} = fakeContext();
    const perPlatform = vi.fn((_context, moduleName, platform) => {
      if (platform === 'windows') throw new Error(`Unable to resolve ${moduleName} for windows`);
      return {type: /** @type {const} */ ('sourceFile'), filePath: `/n/${moduleName}.${platform}.js`};
    });
    expect(resolveWindows(context, './TabsScreen', 'windows', perPlatform)).toEqual({type: 'sourceFile', filePath: '/n/./TabsScreen.web.js'});
    const nowhere = vi.fn((_context, moduleName, platform) => {
      throw new Error(`Unable to resolve ${moduleName} for ${platform}`);
    });
    expect(() => resolveWindows(context, './Missing', 'windows', nowhere)).toThrow('Unable to resolve ./Missing for windows');
  });
});

describe('mainFile', () => {
  it("names the project's own entry, and nothing for Expo's entries or without a package", () => {
    expect(mainFile(FIXTURE)).toBeUndefined();
    expect(mainFile(PACKAGE)).toBe(require.resolve(path.join(PACKAGE, 'src', 'index.ts')));
    expect(mainFile('/nowhere')).toBeUndefined();
    delete process.env.EXPO_WINDOWS_ENTRY;
    withWindows(/** @type {any} */ ({}), {projectRoot: PACKAGE, appConfig: false});
    expect(process.env.EXPO_WINDOWS_ENTRY).toBe(require.resolve(path.join(PACKAGE, 'src', 'index.ts')));
    delete process.env.EXPO_WINDOWS_ENTRY;
    // The transformer already installed leaves the upstream as it is.
    process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER = '/kept';
    withWindows(/** @type {any} */ ({transformer: {babelTransformerPath: TRANSFORMER}}), {projectRoot: FIXTURE, appConfig: false});
    expect(process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER).toBe('/kept');
    delete process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER;
  });
});

describe('runBeforeMain', () => {
  const {INSTALL_WINDOWS, runBeforeMain} = require('./index');

  it('runs the install first, after react-native-windows core where it is installed, ahead of what Expo runs', () => {
    const core = (() => {
      try {
        return require.resolve('react-native-windows/Libraries/Core/InitializeCore', {paths: [PACKAGE]});
      } catch {
        return undefined;
      }
    })();
    const lead = core ? [core, INSTALL_WINDOWS] : [INSTALL_WINDOWS];
    const list = runBeforeMain(PACKAGE, () => ['/rn/InitializeCore', '/expo/winter', INSTALL_WINDOWS])('/app/index.js');
    expect(list).toEqual([...lead, '/rn/InitializeCore', '/expo/winter']);
    expect(runBeforeMain(PACKAGE, undefined)('/app/index.js')).toEqual(lead);
    // Nowhere to find react-native-windows: the install leads alone.
    expect(runBeforeMain('/nowhere', undefined)('/app/index.js')).toEqual([INSTALL_WINDOWS]);
    expect(INSTALL_WINDOWS.endsWith(path.join('src', 'install.windows.ts'))).toBe(true);
  });

  it("is wired into the serializer — the one returned and the one given, which Expo's export serializer holds on to", () => {
    const given = /** @type {any} */ ({serializer: {getModulesRunBeforeMainModule: () => ['/expo/winter']}});
    const config = withWindows(given, {projectRoot: '/app', appConfig: false});
    expect(config.serializer.getModulesRunBeforeMainModule('/app/index.js')).toEqual([INSTALL_WINDOWS, '/expo/winter']);
    expect(given.serializer.getModulesRunBeforeMainModule('/app/index.js')).toEqual([INSTALL_WINDOWS, '/expo/winter']);
    expect(given.serializer.getModulesRunBeforeMainModule).toBe(config.serializer.getModulesRunBeforeMainModule);
    // Applied again, the list stays one install deep.
    expect(withWindows(config, {projectRoot: '/app', appConfig: false}).serializer.getModulesRunBeforeMainModule('/app/index.js')).toEqual([INSTALL_WINDOWS, '/expo/winter']);
  });
});

describe('runBeforeMain with react-native-windows', () => {
  it('puts its core first and drops it from the rest of the list', () => {
    const {INSTALL_WINDOWS, runBeforeMain} = require('./index');
    const list = runBeforeMain('/app', () => ['/rn/InitializeCore', '/rnw/InitializeCore', '/expo/winter'], '/rnw/InitializeCore')('/app/index.js');
    expect(list).toEqual(['/rnw/InitializeCore', INSTALL_WINDOWS, '/rn/InitializeCore', '/expo/winter']);
  });

  it("lists the install by its real path as well when the file system's differs, and once when it does not", () => {
    const {INSTALL_WINDOWS, installPaths} = require('./index');
    expect(installPaths(file => file)).toEqual([INSTALL_WINDOWS]);
    expect(installPaths(() => '/real/expo-windows/src/install.windows.ts')).toEqual([INSTALL_WINDOWS, '/real/expo-windows/src/install.windows.ts']);
    expect(
      installPaths(() => {
        throw new Error('gone');
      }),
    ).toEqual([INSTALL_WINDOWS]);
    // On disk here the package is where it sits, so the default answers once.
    expect(installPaths()).toEqual([INSTALL_WINDOWS]);
  });
});
