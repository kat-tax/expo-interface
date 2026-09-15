// @ts-check
const {patchAppCpp, patchVcxproj, safeProjectName, setProjectProperty} = require('./patch');

const VCXPROJ = `<?xml version="1.0" encoding="utf-8"?>
<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup Label="Globals">
    <RootNamespace>DropFiles</RootNamespace>
    <WindowsAppSdkAutoInitialize>false</WindowsAppSdkAutoInitialize>
  </PropertyGroup>
</Project>
`;

describe('safeProjectName', () => {
  it('makes a PascalCase identifier from an app name', () => {
    expect(safeProjectName('Drop Files')).toBe('DropFiles');
    expect(safeProjectName('drop-files_app')).toBe('DropFilesApp');
    expect(safeProjectName('3d viewer')).toBe('App3dViewer');
    expect(safeProjectName('---')).toBe('App');
  });
});

describe('patchVcxproj', () => {
  it('turns on the runtime bootstrap and makes the app unpackaged', () => {
    const patched = patchVcxproj(VCXPROJ);
    expect(patched).toContain('<WindowsAppSdkAutoInitialize>true</WindowsAppSdkAutoInitialize>');
    expect(patched).not.toContain('<WindowsAppSdkAutoInitialize>false</WindowsAppSdkAutoInitialize>');
    expect(patched).toContain('<PropertyGroup Label="Globals">\n    <WindowsPackageType>None</WindowsPackageType>');
    expect(patchVcxproj(patched)).toBe(patched);
  });

  it('adds a property to the first group when there is no Globals one, and fails without any', () => {
    expect(setProjectProperty('<Project>\n  <PropertyGroup>\n  </PropertyGroup>\n</Project>', 'A', '1')).toContain('<PropertyGroup>\n    <A>1</A>');
    expect(() => setProjectProperty('<Project></Project>', 'A', '1')).toThrow(/PropertyGroup/);
  });
});

describe('patchAppCpp', () => {
  it('points the root view at the component expo registers', () => {
    const app = '  viewOptions.ComponentName(L"DropFiles");\n';
    expect(patchAppCpp(app)).toBe('  viewOptions.ComponentName(L"main");\n');
    expect(patchAppCpp(app, {componentName: 'other'})).toBe('  viewOptions.ComponentName(L"other");\n');
    expect(() => patchAppCpp('int main() {}')).toThrow(/ComponentName/);
  });
});
