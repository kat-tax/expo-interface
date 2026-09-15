// @ts-check
const path = require('node:path');
const {INSTALL, isEntry, withInstall} = require('./transformer');

describe('transformer', () => {
  afterEach(() => {
    delete process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER;
    delete process.env.EXPO_WINDOWS_ENTRY;
  });

  it('recognises the entries a bundle starts from, by the path relative to the project Metro hands over', () => {
    expect(isEntry('node_modules/expo-router/entry.js', undefined)).toBe(true);
    expect(isEntry('/app/node_modules/expo-router/entry.js', undefined)).toBe(true);
    expect(isEntry('node_modules\\expo\\AppEntry.js', undefined)).toBe(true);
    expect(isEntry('node_modules/expo-router/entry-classic.js', undefined)).toBe(false);
    expect(isEntry('index.js', undefined)).toBe(false);
    expect(isEntry('index.js', path.resolve('/app/index.js'), '/app')).toBe(true);
    expect(isEntry('src/index.js', path.resolve('/app/index.js'), '/app')).toBe(false);
    expect(isEntry(path.resolve('/app/index.js'), path.resolve('/app/index.js'))).toBe(true);
  });

  it('prepends the install to a Windows entry and nothing else', () => {
    const src = "import 'expo-router/entry-classic';\n";
    expect(withInstall(src, 'node_modules/expo-router/entry.js', 'windows', undefined)).toBe(`import '${INSTALL}';\n${src}`);
    expect(withInstall(src, 'node_modules/expo-router/entry.js', 'ios', undefined)).toBe(src);
    expect(withInstall(src, 'node_modules/expo-router/build/ExpoRoot.js', 'windows', undefined)).toBe(src);
    expect(withInstall(src, 'index.js', 'windows', path.resolve('/app/index.js'), '/app')).toBe(`import '${INSTALL}';\n${src}`);
  });

  it('hands the source to the transformer it wraps, with the install first on Windows', async () => {
    const calls = /** @type {any[]} */ ([]);
    const fake = path.join(__dirname, '..', '..', 'node_modules', '.cache', 'expo-windows-fake-transformer.cjs');
    require('node:fs').mkdirSync(path.dirname(fake), {recursive: true});
    require('node:fs').writeFileSync(fake, 'module.exports = {transform: async args => args, getCacheKey: () => "fake"};');
    process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER = fake;
    process.env.EXPO_WINDOWS_ENTRY = path.normalize('/app/index.js');
    // A fresh module instance, so the upstream is read from the environment set here.
    delete require.cache[require.resolve('./transformer')];
    const {transform, getCacheKey} = require('./transformer');
    const entry = await transform({src: 'main();', filename: '/app/index.js', options: {platform: 'windows'}});
    const other = {src: 'other();', filename: '/app/other.js', options: {platform: 'windows'}};
    const passed = await transform(other);
    calls.push(entry, passed);
    expect(entry.src).toBe(`import '${INSTALL}';\nmain();`);
    expect(passed).toBe(other);
    expect(getCacheKey()).toBe(`fake:expo-windows:${path.normalize('/app/index.js')}`);
  });
});

describe('transformer defaults', () => {
  it('wraps Expo\'s own transformer when none is named, and keys the cache without one', () => {
    delete process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER;
    delete process.env.EXPO_WINDOWS_ENTRY;
    delete require.cache[require.resolve('./transformer')];
    const fresh = require('./transformer');
    expect(fresh.getCacheKey()).toMatch(/:expo-windows:$/);
    const bare = path.join(__dirname, '..', '..', 'node_modules', '.cache', 'expo-windows-bare-transformer.cjs');
    require('node:fs').writeFileSync(bare, 'module.exports = {transform: async args => args};');
    process.env.EXPO_WINDOWS_UPSTREAM_TRANSFORMER = bare;
    delete require.cache[require.resolve('./transformer')];
    expect(require('./transformer').getCacheKey()).toBe(':expo-windows:');
  });
});
