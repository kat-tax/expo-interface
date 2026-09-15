// @ts-check
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {applyPatches, findProject} = require('./project');

/** A throwaway app folder with a generated-looking `windows/` project in it. */
function scaffold({withApp = true, withProject = true} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-'));
  if (withProject) {
    const dir = path.join(root, 'windows', 'DropFiles');
    fs.mkdirSync(path.join(root, 'windows', 'loose-folder'), {recursive: true});
    fs.mkdirSync(dir, {recursive: true});
    // A file that sorts before the project folder: the search skips it.
    fs.writeFileSync(path.join(root, 'windows', '.gitignore'), '');
    fs.writeFileSync(
      path.join(dir, 'DropFiles.vcxproj'),
      '<Project>\n  <PropertyGroup Label="Globals">\n    <WindowsAppSdkAutoInitialize>false</WindowsAppSdkAutoInitialize>\n  </PropertyGroup>\n</Project>\n',
    );
    if (withApp) fs.writeFileSync(path.join(dir, 'DropFiles.cpp'), 'viewOptions.ComponentName(L"DropFiles");\n');
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
    expect(first).toEqual({name: 'DropFiles', changed: [path.join('windows', 'DropFiles', 'DropFiles.vcxproj'), path.join('windows', 'DropFiles', 'DropFiles.cpp')]});
    expect(fs.readFileSync(path.join(root, 'windows', 'DropFiles', 'DropFiles.vcxproj'), 'utf8')).toContain('<WindowsPackageType>None</WindowsPackageType>');
    expect(fs.readFileSync(path.join(root, 'windows', 'DropFiles', 'DropFiles.cpp'), 'utf8')).toContain('L"main"');
    expect(applyPatches(root)).toEqual({name: 'DropFiles', changed: []});
  });

  it('patches only the project when the entry is missing, and refuses without a project', () => {
    expect(applyPatches(scaffold({withApp: false})).changed).toEqual([path.join('windows', 'DropFiles', 'DropFiles.vcxproj')]);
    expect(() => applyPatches(scaffold({withProject: false}))).toThrow(/No react-native-windows project/);
  });
});

describe('ensureScreensExclusion', () => {
  const {ensureScreensExclusion, SCREENS_EXCLUSION} = require('./project');

  it('writes the config that keeps react-native-screens out of Windows autolinking, and leaves an existing one alone', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-'));
    expect(ensureScreensExclusion(root)).toBe('written');
    const written = fs.readFileSync(path.join(root, 'react-native.config.js'), 'utf8');
    expect(written).toBe(SCREENS_EXCLUSION);
    expect(require(path.join(root, 'react-native.config.js'))).toEqual({dependencies: {'react-native-screens': {platforms: {windows: null}}}});
    fs.writeFileSync(path.join(root, 'react-native.config.js'), 'module.exports = {};');
    expect(ensureScreensExclusion(root)).toBe('kept');
    expect(fs.readFileSync(path.join(root, 'react-native.config.js'), 'utf8')).toBe('module.exports = {};');
  });
});
