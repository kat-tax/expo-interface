import type {Alias} from 'vite';
import type {TestProjectInlineConfiguration, ViteUserConfig} from 'vitest/config';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {configDefaults} from 'vitest/config';
import {vitestExpo, vitestExpoProjects} from 'vitest-expo';
import {forbidModules} from './forbid-modules.ts';
import {EXPO_WEB_PACKAGES, metroCompat} from './metro-compat.ts';
import {TEST_TIMEOUT} from './timeout.ts';
import {windowsResolution} from './windows-resolution.ts';

export type Platform = 'ios' | 'android' | 'web' | 'windows';

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** Whether this is the compiled package rather than its source: the files beside it are `.js` then. */
const BUILT = !fileURLToPath(import.meta.url).endsWith('.ts');

/** The package's subpaths, by the source file each is. `package.json`'s `exports` say the same; a test keeps them in step. */
export const SUBPATHS: Record<string, string> = {
  native: 'native.ts',
  windows: 'windows.ts',
  router: 'router.tsx',
  device: 'device/index.ts',
  'device/matchers': 'device/matchers.ts',
  'metro-compat': 'metro-compat.ts',
};

/** A file of this package, as it is on disk here: source in the repository, compiled once installed. */
export function file(source: string): string {
  return path.join(HERE, BUILT ? source.replace(/\.tsx?$/, '.js') : source);
}

/**
 * The package's own subpaths as absolute files, so that a test's import of
 * `expo-vitest/windows` and the setup files land on one copy of each module
 * whether the package is a workspace or installed.
 */
export function selfAliases(): Alias[] {
  return Object.entries(SUBPATHS).map(([subpath, source]) => ({find: new RegExp(`^expo-vitest/${subpath}$`), replacement: file(source)}));
}

/**
 * Keeps this package in the Vite module graph once it is installed, where its
 * setup files' `vi.mock` is hoisted and its helpers share the tests' modules.
 * Anchored on `node_modules`: a checkout of this package is a folder called
 * `expo-vitest` too, and everything under that is not this package. From
 * source nothing needs saying, since only `node_modules` is left out.
 */
export const SELF = /[\\/]node_modules[\\/]expo-vitest[\\/]/;

/**
 * Packages that ship TypeScript sources as their entry points. Node's loader
 * cannot strip types inside `node_modules`, so they stay in the Vite module
 * graph, where they are transformed like app code.
 */
const TYPESCRIPT_PACKAGES = ['expo-modules-core', '@expo/ui', '@expo/dom-webview'];

/** A pattern matching the files of a package, wherever it is installed. */
function packagePattern(name: string): RegExp {
  return new RegExp(`[\\\\/]${name.split('/').map(escape).join('[\\\\/]')}[\\\\/]`);
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whether a package is installed where the project would find it: up through the `node_modules` folders. */
export function isInstalled(root: string, name: string): boolean {
  let folder = path.resolve(root);
  for (;;) {
    if (existsSync(path.join(folder, 'node_modules', name, 'package.json'))) return true;
    const parent = path.dirname(folder);
    if (parent === folder) return false;
    folder = parent;
  }
}

export interface ExpoProjectsOptions {
  /** The project's folder. The working directory, unless the tests live in a folder of their own under it. */
  root?: string;
  /** One Vitest project for each. All four, unless given. */
  platforms?: Platform[];
  /** The folders holding tests, from the root. `['src']` unless given. */
  include?: string[];
  /** More packages that ship TypeScript or untranspiled sources, besides Expo's. */
  transformPackages?: string[];
  /** How long one test may take, in milliseconds. */
  timeout?: number;
  windows?: {
    /** The project's name, `windows` unless given. */
    name?: string;
    /** Modules with no Windows implementation: importing one throws. */
    forbid?: string[];
    /** More folders whose relative imports resolve `.windows.*` files first, from the root: an installed library's source. */
    resolveIn?: string[];
    /** The test files, in place of the ones the names pick. A package for Windows alone runs every test there. */
    include?: string[];
  };
  web?: {
    /** More packages for the dependency optimizer to pre-bundle, besides Expo's. */
    optimize?: string[];
    /** More aliases. */
    alias?: Alias[];
  };
}

/** The test files a platform leaves to the others. */
const OTHERS: Record<Platform, string[]> = {
  ios: ['**/*.web.test.*', '**/*.android.test.*', '**/*.windows.test.*'],
  android: ['**/*.web.test.*', '**/*.ios.test.*', '**/*.windows.test.*'],
  web: ['**/*.native.test.*', '**/*.ios.test.*', '**/*.android.test.*', '**/*.windows.test.*'],
  // A platform's own `.ts` test is still a `*.test.ts`, so the shared pattern
  // would pull `foo.web.test.ts` in and run it with no DOM: named, like the rest.
  windows: ['**/*.web.test.*', '**/*.ios.test.*', '**/*.android.test.*', '**/*.native.test.*'],
};

/**
 * One Vitest project per platform, for code that resolves a different file on
 * each (`index.ios.tsx`, `index.android.tsx`, `index.web.tsx`,
 * `index.windows.tsx`). A test file picks its platforms by name:
 *
 * - `*.test.ts`             every platform, Windows included
 * - `*.test.tsx`            iOS, Android and web
 * - `*.native.test.tsx`     iOS and Android
 * - `*.ios.test.tsx`        iOS only
 * - `*.android.test.tsx`    Android only
 * - `*.web.test.tsx`        web only
 * - `*.windows.test.tsx`    Windows only
 *
 * iOS and Android run on vitest-native's engines through `vitest-expo`. Web
 * is react-native-web in jsdom, with the dependency optimizer pre-bundling the
 * Expo packages. Windows runs on the iOS engine, which is the nearest there
 * is, told it is Windows and resolving `.windows.*` files first.
 *
 *     export default defineConfig({test: {projects: expoProjects()}});
 *
 * Projects do not inherit the root `test` block, so each carries its own
 * globals, mock clearing and timeout.
 */
export function expoProjects(options: ExpoProjectsOptions = {}): TestProjectInlineConfiguration[] {
  const root = path.resolve(options.root ?? process.cwd());
  const platforms = options.platforms ?? ['ios', 'android', 'windows', 'web'];
  const folders = options.include ?? ['src'];
  const transformPackages = [...TYPESCRIPT_PACKAGES, ...(options.transformPackages ?? [])];
  const inline = [SELF, ...transformPackages.map(packagePattern)];
  // The root is given twice, as Vite's and as Vitest's: the engine's plugins read
  // the first, and where they disagree the engine resolves packages from one
  // folder for code that lives in another.
  const common = {
    root,
    globals: true,
    clearMocks: true,
    testTimeout: options.timeout ?? TEST_TIMEOUT,
  };
  const everyTest = folders.map(folder => `${folder}/**/*.test.{ts,tsx}`);
  const projects: TestProjectInlineConfiguration[] = [];

  for (const platform of platforms) {
    if (platform === 'ios' || platform === 'android') {
      const [preset] = vitestExpoProjects({jestCompat: false, platforms: [platform], transformPackages});
      projects.push({
        ...preset,
        root,
        resolve: {alias: selfAliases()},
        test: {
          ...preset.test,
          ...common,
          include: everyTest,
          exclude: [...configDefaults.exclude, ...OTHERS[platform]],
          setupFiles: [file('setup/native.ts')],
          server: {deps: {inline}},
        },
      });
    }

    if (platform === 'windows') {
      const [preset] = vitestExpoProjects({jestCompat: false, platforms: ['ios'], transformPackages});
      const windows = options.windows ?? {};
      projects.push({
        ...preset,
        root,
        plugins: [forbidModules(windows.forbid ?? []), windowsResolution(root, windows.resolveIn), ...preset.plugins],
        resolve: {alias: selfAliases()},
        test: {
          ...preset.test,
          ...common,
          name: windows.name ?? 'windows',
          include: windows.include ?? folders.flatMap(folder => [`${folder}/**/*.windows.test.{ts,tsx}`, `${folder}/**/*.test.ts`]),
          exclude: [...configDefaults.exclude, ...OTHERS.windows],
          setupFiles: [file('setup/windows.ts')],
          server: {deps: {inline}},
        },
      });
    }

    if (platform === 'web') {
      const web = options.web ?? {};
      const optimize = [...EXPO_WEB_PACKAGES, 'expo-router/testing-library', 'expo-router/build/ui/index.js', ...(web.optimize ?? [])];
      projects.push({
        root,
        plugins: [metroCompat(), vitestExpo({platform: 'web', jestCompat: false, transformPackages: transformPackages.filter(name => name !== '@expo/dom-webview')})],
        resolve: {
          alias: [
            ...selfAliases(),
            // `expo-router/ui` is an ESM stub (`export * from './build/ui'`) over a
            // CJS module. The optimizer cannot enumerate `export *` of CJS, so the
            // bundle ends up with no exports and Vite skips its CJS interop; point
            // at the CJS entry itself, which is wrapped as `default` + interop.
            {find: /^expo-router\/ui$/, replacement: 'expo-router/build/ui/index.js'},
            ...(web.alias ?? []),
          ],
        },
        test: {
          ...common,
          name: 'web',
          include: everyTest,
          exclude: [...configDefaults.exclude, ...OTHERS.web],
          setupFiles: [file('setup/web.ts')],
          server: {deps: {inline: [SELF]}},
          deps: {
            optimizer: {
              client: {
                enabled: true,
                // A package that is not installed cannot be pre-bundled, and naming it is an error.
                include: optimize.filter(name => isInstalled(root, name.split('/').slice(0, name.startsWith('@') ? 2 : 1).join('/'))),
                rolldownOptions: {plugins: [metroCompat()]},
              },
            },
          },
        },
      });
    }
  }
  return projects;
}

/** A plain Node project beside the platform ones, for code that runs in Node: a Metro config, a CLI. */
export function nodeProject(options: {name: string; include: string[]; root?: string; timeout?: number}): TestProjectInlineConfiguration {
  return {
    test: {
      name: options.name,
      root: path.resolve(options.root ?? process.cwd()),
      testTimeout: options.timeout ?? TEST_TIMEOUT,
      environment: 'node',
      globals: true,
      clearMocks: true,
      include: options.include,
    },
  };
}


/**
 * The config for device tests: the ones that drive a real build of the app
 * and read what it actually rendered (`expo-vitest/device`). Its own config
 * rather than a project, since it needs an app running somewhere and is run
 * on purpose:
 *
 *     export default defineConfig(deviceConfig());
 *
 *     HARNESS_PLATFORM=web HARNESS_URL=http://localhost:8081 vitest run --config vitest.config.device.mts
 */
export function deviceConfig(options: {include?: string[]; timeout?: number} = {}): ViteUserConfig {
  const timeout = options.timeout ?? 120_000;
  return {
    resolve: {alias: selfAliases()},
    test: {
      name: 'device',
      globals: true,
      environment: 'node',
      include: options.include ?? ['device/**/*.test.ts'],
      setupFiles: [file('device/matchers.ts')],
      // A real app, a real renderer: slower than a component test by a lot.
      testTimeout: timeout,
      hookTimeout: timeout,
      // One app, one driver: two files must not press the same window at once.
      fileParallelism: false,
      pool: 'forks',
      maxWorkers: 1,
    },
  };
}
