// @ts-check
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {applyPatches, findProject, keepMetroConfig, METRO_CONFIG} = require('./project');

/** A throwaway app folder with a generated-looking `windows/` project in it. */
function scaffold({withApp = true, withProject = true} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-'));
  if (withProject) {
    const dir = path.join(root, 'windows', 'DropFiles');
    fs.mkdirSync(path.join(root, 'windows', 'loose-folder'), {recursive: true});
    fs.mkdirSync(dir, {recursive: true});
    // A file that sorts before the project folder: the search skips it.
    fs.writeFileSync(path.join(root, 'windows', '.gitignore'), '');
    fs.writeFileSync(path.join(root, 'windows', 'ExperimentalFeatures.props'), '<Project>\n  <PropertyGroup>\n    <RnwNewArch>true</RnwNewArch>\n  </PropertyGroup>\n</Project>\n');
    fs.writeFileSync(
      path.join(dir, 'DropFiles.vcxproj'),
      '<Project>\n  <PropertyGroup Label="Globals">\n    <WindowsAppSdkAutoInitialize>false</WindowsAppSdkAutoInitialize>\n  </PropertyGroup>\n</Project>\n',
    );
    if (withApp) {
      fs.writeFileSync(
        path.join(dir, 'DropFiles.cpp'),
        '#include "pch.h"\nint WinMain() {\n  winrt::init_apartment(winrt::apartment_type::single_threaded);\n  viewOptions.ComponentName(L"DropFiles");\n}\n',
      );
    }
  }
  return root;
}

describe('findProject', () => {
  it('finds the folder with the project file and the app entry next to it', () => {
    const root = scaffold();
    const project = findProject(root);
    expect(project).toMatchObject({name: 'DropFiles', dir: path.join(root, 'windows', 'DropFiles')});
    expect(project?.vcxproj).toBe(path.join(root, 'windows', 'DropFiles', 'DropFiles.vcxproj'));
    expect(project?.appCpp).toBe(path.join(root, 'windows', 'DropFiles', 'DropFiles.cpp'));
  });

  it('is null without a windows folder or a project in it, and tolerates a missing entry', () => {
    expect(findProject(scaffold({withProject: false}))).toBeNull();
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-'));
    fs.mkdirSync(path.join(empty, 'windows', 'nothing'), {recursive: true});
    expect(findProject(empty)).toBeNull();
    expect(findProject(scaffold({withApp: false}))?.appCpp).toBeNull();
  });
});

describe('applyPatches', () => {
  it('patches the project and the entry, reports what changed, and changes nothing the second time', () => {
    const root = scaffold();
    const first = applyPatches(root);
    expect(first).toEqual({
      name: 'DropFiles',
      changed: [path.join('windows', 'DropFiles', 'DropFiles.vcxproj'), path.join('windows', 'DropFiles', 'DropFiles.cpp'), path.join('windows', 'ExperimentalFeatures.props')],
    });
    expect(fs.readFileSync(path.join(root, 'windows', 'DropFiles', 'DropFiles.vcxproj'), 'utf8')).toContain('<WindowsPackageType>None</WindowsPackageType>');
    const entry = fs.readFileSync(path.join(root, 'windows', 'DropFiles', 'DropFiles.cpp'), 'utf8');
    expect(entry).toContain('L"main"');
    expect(entry).toContain('FindOrRegisterForKey(L"main")');
    expect(fs.readFileSync(path.join(root, 'windows', 'ExperimentalFeatures.props'), 'utf8')).toContain('<UseFabric>true</UseFabric>');
    expect(applyPatches(root)).toEqual({name: 'DropFiles', changed: []});
  });

  it('patches only the project when the entry and the features file are missing, and refuses without a project', () => {
    const root = scaffold({withApp: false});
    fs.rmSync(path.join(root, 'windows', 'ExperimentalFeatures.props'));
    expect(applyPatches(root).changed).toEqual([path.join('windows', 'DropFiles', 'DropFiles.vcxproj')]);
    expect(() => applyPatches(scaffold({withProject: false}))).toThrow(/No react-native-windows project/);
  });
});

describe('keepMetroConfig', () => {
  it('puts the app\'s metro.config.js back after init-windows wrote its own over it, and leaves an untouched one alone', () => {
    const root = scaffold({withProject: false});
    const file = path.join(root, 'metro.config.js');
    const theirs = 'module.exports = withWindows(getDefaultConfig(__dirname)); // the app\'s\n';
    fs.writeFileSync(file, theirs);
    const restore = keepMetroConfig(root);
    fs.writeFileSync(file, "module.exports = mergeConfig(getDefaultConfig(__dirname), config); // react-native-windows'\n");
    expect(restore()).toBe('restored');
    expect(fs.readFileSync(file, 'utf8')).toBe(theirs);
    const again = keepMetroConfig(root);
    expect(again()).toBe('kept');
    expect(fs.readFileSync(file, 'utf8')).toBe(theirs);
  });

  it('writes a config that applies withWindows when the app had none, unless init-windows left one that does', () => {
    const root = scaffold({withProject: false});
    const file = path.join(root, 'metro.config.js');
    const restore = keepMetroConfig(root);
    fs.writeFileSync(file, "module.exports = mergeConfig(getDefaultConfig(__dirname), config); // react-native-windows'\n");
    expect(restore()).toBe('written');
    expect(fs.readFileSync(file, 'utf8')).toBe(METRO_CONFIG);
    expect(METRO_CONFIG).toContain("require('expo-windows/metro')");
    // None before, none after either: written too.
    const bare = scaffold({withProject: false});
    expect(keepMetroConfig(bare)()).toBe('written');
    // None before, but one applying withWindows after: kept.
    const ready = scaffold({withProject: false});
    const keep = keepMetroConfig(ready);
    fs.writeFileSync(path.join(ready, 'metro.config.js'), METRO_CONFIG);
    expect(keep()).toBe('kept');
  });
});

describe('ensureScreensExclusion', () => {
  const {ensureScreensExclusion, SCREENS_EXCLUSION} = require('./project');

  it('writes the config that keeps react-native-screens out of Windows autolinking, and leaves an existing one alone', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-'));
    expect(ensureScreensExclusion(root)).toBe('written');
    const written = fs.readFileSync(path.join(root, 'react-native.config.js'), 'utf8');
    expect(written).toBe(SCREENS_EXCLUSION);
    expect(require(path.join(root, 'react-native.config.js'))).toEqual({dependencies: {'react-native-screens': {platforms: {windows: null}}, '@react-native-community/netinfo': {platforms: {windows: null}}}});
    fs.writeFileSync(path.join(root, 'react-native.config.js'), 'module.exports = {};');
    expect(ensureScreensExclusion(root)).toBe('kept');
    expect(fs.readFileSync(path.join(root, 'react-native.config.js'), 'utf8')).toBe('module.exports = {};');
  });
});
