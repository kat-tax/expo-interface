// @ts-check
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {ALIASES, contributedAliases, packageFolder, resolveWindows, withWindows} = require('./index');

/** @type {string[]} */
const made = [];

/**
 * A project on disk: its manifest, and the packages in its `node_modules`,
 * each a manifest and whatever other files it is given.
 * @param {object} manifest
 * @param {Record<string, Record<string, string>>} [packages] a package's name to its files, by relative path
 * @param {string} [inside] a folder to make the project in, for one nested under another
 */
function project(manifest, packages = {}, inside) {
  const root = inside ?? fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-aliases-'));
  if (!inside) made.push(root);
  fs.mkdirSync(root, {recursive: true});
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(manifest));
  for (const [name, files] of Object.entries(packages)) {
    for (const [file, content] of Object.entries(files)) {
      const target = path.join(root, 'node_modules', name, file);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, content);
    }
  }
  return root;
}

/** A resolver that answers with a source file named after what it was asked. */
function fakeContext() {
  const resolveRequest = vi.fn((_context, moduleName) => ({type: /** @type {const} */ ('sourceFile'), filePath: `/node_modules/${moduleName}.js`}));
  return /** @type {any} */ ({resolveRequest, originModulePath: '/app/index.js'});
}

afterAll(() => {
  for (const root of made) fs.rmSync(root, {recursive: true, force: true});
});

describe('contributedAliases', () => {
  it('reads the table a dependency names, each file beside the table', () => {
    const root = project(
      {dependencies: {'a-kit': '1.0.0'}, devDependencies: {'a-dev-kit': '1.0.0'}},
      {
        'a-kit': {
          'package.json': JSON.stringify({name: 'a-kit', 'expo-windows': {aliases: './windows/aliases.json'}}),
          'windows/aliases.json': JSON.stringify({'@expo/ui': './expo-ui.tsx', 'a-slider': '../src/slider.tsx'}),
        },
        'a-dev-kit': {
          'package.json': JSON.stringify({name: 'a-dev-kit', 'expo-windows': {aliases: 'table.json'}}),
          'table.json': JSON.stringify({'a-picker': 'picker.tsx'}),
        },
      },
    );
    expect(contributedAliases(root)).toEqual({
      '@expo/ui': path.join(root, 'node_modules', 'a-kit', 'windows', 'expo-ui.tsx'),
      'a-slider': path.join(root, 'node_modules', 'a-kit', 'src', 'slider.tsx'),
      'a-picker': path.join(root, 'node_modules', 'a-dev-kit', 'picker.tsx'),
    });
  });

  it('passes over a dependency that names no table, one that is not installed, and a project with no manifest', () => {
    const root = project(
      {dependencies: {plain: '1.0.0', settings: '1.0.0', absent: '1.0.0'}},
      {
        plain: {'package.json': JSON.stringify({name: 'plain'})},
        settings: {'package.json': JSON.stringify({name: 'settings', 'expo-windows': {other: true}})},
      },
    );
    expect(contributedAliases(root)).toEqual({});
    expect(contributedAliases(path.join(root, 'nowhere'))).toEqual({});
  });

  it('says which package named a table that cannot be read', () => {
    const root = project(
      {dependencies: {broken: '1.0.0'}},
      {broken: {'package.json': JSON.stringify({name: 'broken', 'expo-windows': {aliases: './missing.json'}})}},
    );
    expect(() => contributedAliases(root)).toThrow(/^broken names \.\/missing\.json as its Windows aliases, which cannot be read: /);
  });
});

describe('packageFolder', () => {
  it('finds a package hoisted above the project, and nothing for one that is nowhere', () => {
    const root = project({}, {hoisted: {'package.json': '{}'}});
    const app = project({dependencies: {hoisted: '1.0.0'}}, {}, path.join(root, 'apps', 'mobile'));
    expect(packageFolder(app, 'hoisted')).toBe(path.join(root, 'node_modules', 'hoisted'));
    expect(packageFolder(app, 'expo-windows-no-such-package')).toBeUndefined();
  });
});

describe('withWindows aliases', () => {
  afterEach(() => {
    delete process.env.EXPO_WINDOWS_ENTRY;
  });

  it("resolves a dependency's aliases under the runtime's own, and the app's over both", () => {
    const root = project(
      {dependencies: {'a-kit': '1.0.0'}},
      {
        'a-kit': {
          'package.json': JSON.stringify({name: 'a-kit', 'expo-windows': {aliases: 'aliases.json'}}),
          'aliases.json': JSON.stringify({'a-control': 'control.tsx', 'expo-image': 'image.tsx', 'a-menu': 'menu.tsx'}),
        },
      },
    );
    const config = withWindows(/** @type {any} */ ({projectRoot: root}), {appConfig: false, aliases: {'a-menu': '/app/menu.tsx'}});
    const resolve = /** @type {(context: any, name: string, platform: string) => any} */ (config.resolver.resolveRequest);
    const context = fakeContext();
    expect(resolve(context, 'a-control', 'windows')).toEqual({type: 'sourceFile', filePath: path.join(root, 'node_modules', 'a-kit', 'control.tsx')});
    expect(resolve(context, 'expo-image', 'windows')).toEqual({type: 'sourceFile', filePath: ALIASES['expo-image']});
    expect(resolve(context, 'a-menu', 'windows')).toEqual({type: 'sourceFile', filePath: '/app/menu.tsx'});
    // Windows only: another platform's bundle never sees them.
    expect(resolve(context, 'a-control', 'ios')).toEqual({type: 'sourceFile', filePath: '/node_modules/a-control.js'});
  });

  it('takes no inherited property for an alias', () => {
    const context = fakeContext();
    expect(resolveWindows(context, 'constructor', 'windows', undefined)).toEqual({type: 'sourceFile', filePath: '/node_modules/constructor.js'});
  });
});
