import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {deviceConfig, expoProjects, file, isInstalled, nodeProject, SELF, selfAliases, SUBPATHS} from './projects.ts';

const PACKAGE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(PACKAGE, 'package.json'), 'utf8'));

/** A project's `test` block, which the type leaves optional. */
function testOf(project: {test?: Record<string, any>}): Record<string, any> {
  return project.test as Record<string, any>;
}

describe('the subpaths', () => {
  it('are the ones the package exports, each a source file that exists', () => {
    const exported = Object.keys(manifest.exports)
      .filter(key => !['.', './types', './package.json'].includes(key))
      .map(key => key.slice(2));
    expect(Object.keys(SUBPATHS).sort()).toEqual(exported.sort());
    for (const [subpath, source] of Object.entries(SUBPATHS)) {
      expect(fs.existsSync(path.join(PACKAGE, 'src', source)), subpath).toBe(true);
      // The compiled file the export names is the source's, under `dist`.
      expect(manifest.exports[`./${subpath}`].default).toBe(`./dist/${source.replace(/\.tsx?$/, '.js')}`);
    }
  });

  it('alias each to its file here, source while this is source', () => {
    expect(file('windows.ts')).toBe(path.join(PACKAGE, 'src', 'windows.ts'));
    const aliases = selfAliases();
    expect(aliases).toHaveLength(Object.keys(SUBPATHS).length);
    const router = aliases.find(alias => (alias.find as RegExp).test('expo-vitest/router'));
    expect(router?.replacement).toBe(path.join(PACKAGE, 'src', 'router.tsx'));
    // A subpath is matched whole: `device` is not `device/matchers`.
    expect(aliases.filter(alias => (alias.find as RegExp).test('expo-vitest/device/matchers'))).toHaveLength(1);
    expect(aliases.filter(alias => (alias.find as RegExp).test('expo-vitest/windows/more'))).toHaveLength(0);
  });
});

describe('the module graph', () => {
  it('keeps this package in it where it is installed, and not what a checkout of the same name installs', () => {
    expect(SELF.test('C:/work/app/node_modules/expo-vitest/dist/native.js')).toBe(true);
    expect(SELF.test('/work/app/node_modules/.pnpm/expo-vitest@1.0.0/node_modules/expo-vitest/dist/native.js')).toBe(true);
    expect(SELF.test('C:\\work\\app\\node_modules\\expo-vitest\\dist\\native.js')).toBe(true);
    expect(SELF.test('C:\\dev\\expo-vitest\\node_modules\\react-native\\index.js')).toBe(false);
    expect(SELF.test('/dev/expo-vitest/src/native.ts')).toBe(false);
  });
});

describe('isInstalled', () => {
  it('finds a package up through the folders, and not one that is nowhere', () => {
    expect(isInstalled(path.join(PACKAGE, 'src'), 'vitest')).toBe(true);
    expect(isInstalled(PACKAGE, 'expo-vitest-no-such-package')).toBe(false);
  });
});

describe('expoProjects', () => {
  it('makes a project per platform, each taking the files its name is in', () => {
    const projects = expoProjects({root: PACKAGE});
    expect(projects.map(project => testOf(project).name)).toEqual(['ios', 'android', 'windows', 'web']);
    const [ios, android, windows, web] = projects.map(testOf);
    expect(ios.include).toEqual(['src/**/*.test.{ts,tsx}']);
    expect(ios.exclude).toEqual(expect.arrayContaining(['**/*.web.test.*', '**/*.android.test.*', '**/*.windows.test.*']));
    expect(android.exclude).toEqual(expect.arrayContaining(['**/*.ios.test.*']));
    expect(android.exclude).not.toContain('**/*.android.test.*');
    expect(windows.include).toEqual(['src/**/*.windows.test.{ts,tsx}', 'src/**/*.test.ts']);
    expect(windows.exclude).toEqual(expect.arrayContaining(['**/*.native.test.*', '**/*.web.test.*']));
    expect(web.exclude).toEqual(expect.arrayContaining(['**/*.native.test.*', '**/*.windows.test.*']));
    // Vite's root as well as Vitest's: the engine's plugins read the first.
    expect(projects.map(project => project.root)).toEqual([PACKAGE, PACKAGE, PACKAGE, PACKAGE]);
    for (const project of [ios, android, windows, web]) {
      expect(project).toMatchObject({globals: true, clearMocks: true, testTimeout: 15_000, root: PACKAGE});
      expect(project.setupFiles).toHaveLength(1);
      expect(fs.existsSync(project.setupFiles[0]), project.setupFiles[0]).toBe(true);
    }
  });

  it('takes the folders, the platforms, the timeout and a Windows project of another name and other files', () => {
    const projects = expoProjects({
      root: PACKAGE,
      platforms: ['windows'],
      include: ['src', 'app'],
      timeout: 1000,
      windows: {name: 'runtime', include: ['src/**/*.test.{ts,tsx}'], forbid: ['a'], resolveIn: ['node_modules/kit/src']},
    });
    expect(projects).toHaveLength(1);
    expect(testOf(projects[0])).toMatchObject({name: 'runtime', include: ['src/**/*.test.{ts,tsx}'], testTimeout: 1000});
    const names = (projects[0].plugins as {name?: string}[]).map(plugin => plugin.name);
    expect(names.slice(0, 2)).toEqual(['expo-vitest:forbid-modules', 'expo-vitest:windows-resolution']);

    const [ios] = expoProjects({root: PACKAGE, platforms: ['ios'], include: ['src', 'app']});
    expect(testOf(ios).include).toEqual(['src/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}']);
  });

  it('pre-bundles for web only what is installed, with what it was given besides', () => {
    const [web] = expoProjects({root: PACKAGE, platforms: ['web'], web: {optimize: ['vitest', 'expo-vitest-no-such-package'], alias: [{find: 'a', replacement: 'b'}]}});
    const include: string[] = testOf(web).deps.optimizer.client.include;
    expect(include).toContain('vitest');
    expect(include).not.toContain('expo-vitest-no-such-package');
    expect(include).toContain('@expo/ui');
    expect((web.resolve as unknown as {alias: {find: unknown}[]}).alias.map(alias => alias.find)).toContain('a');
  });
});

describe('nodeProject and deviceConfig', () => {
  it('is a Node project of the name and files given', () => {
    expect(testOf(nodeProject({name: 'cli', include: ['cli/**/*.test.js'], root: PACKAGE, timeout: 5}))).toEqual({
      name: 'cli',
      root: PACKAGE,
      testTimeout: 5,
      environment: 'node',
      globals: true,
      clearMocks: true,
      include: ['cli/**/*.test.js'],
    });
    expect(testOf(nodeProject({name: 'cli', include: []}))).toMatchObject({root: process.cwd(), testTimeout: 15_000});
  });

  it('runs device tests one at a time, with the matchers registered', () => {
    const device = testOf(deviceConfig());
    expect(device).toMatchObject({name: 'device', include: ['device/**/*.test.ts'], fileParallelism: false, maxWorkers: 1, testTimeout: 120_000, hookTimeout: 120_000});
    expect(device.setupFiles).toEqual([path.join(PACKAGE, 'src', 'device', 'matchers.ts')]);
    expect(testOf(deviceConfig({include: ['e2e/**/*.test.ts'], timeout: 10}))).toMatchObject({include: ['e2e/**/*.test.ts'], testTimeout: 10});
  });
});
