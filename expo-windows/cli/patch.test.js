// @ts-check
const {patchAppCpp, patchExperimentalFeatures, patchSingleInstance, patchVcxproj, safeProjectName, setProjectProperty} = require('./patch');

const FEATURES = `<?xml version="1.0" encoding="utf-8"?>
<Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup Label="Microsoft.ReactNative Experimental Features">
    <RnwNewArch>true</RnwNewArch>
    <UseExperimentalNuget>true</UseExperimentalNuget>
  </PropertyGroup>
</Project>
`;

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

describe('patchExperimentalFeatures', () => {
  it('states UseFabric after RnwNewArch and turns the transitive-dependency check off, once', () => {
    const patched = patchExperimentalFeatures(FEATURES);
    expect(patched).toContain('<RnwNewArch>true</RnwNewArch>\n    <!--');
    expect(patched).toContain('<UseFabric>true</UseFabric>\n    <WindowsAppSDKVerifyTransitiveDependencies>false</WindowsAppSDKVerifyTransitiveDependencies>\n    <UseExperimentalNuget>');
    expect(patched.split('expo-windows: library projects').length - 1).toBe(1);
    expect(patchExperimentalFeatures(patched)).toBe(patched);
  });

  it('replaces the values where an app set them otherwise, and refuses an Old Architecture file', () => {
    const otherwise = FEATURES.replace('<UseExperimentalNuget>', '<UseFabric>false</UseFabric>\n    <WindowsAppSDKVerifyTransitiveDependencies>true</WindowsAppSDKVerifyTransitiveDependencies>\n    <UseExperimentalNuget>');
    const patched = patchExperimentalFeatures(otherwise);
    expect(patched).toContain('<UseFabric>true</UseFabric>');
    expect(patched).toContain('<WindowsAppSDKVerifyTransitiveDependencies>false</WindowsAppSDKVerifyTransitiveDependencies>');
    expect(patched).not.toContain('expo-windows: library projects');
    expect(() => patchExperimentalFeatures(FEATURES.replace('<RnwNewArch>true</RnwNewArch>', '<RnwNewArch>false</RnwNewArch>'))).toThrow(/New Architecture/);
  });

  it('adds back a property removed from a patched file, under the note that is there', () => {
    const patched = patchExperimentalFeatures(FEATURES);
    const without = patched.replace('\n    <WindowsAppSDKVerifyTransitiveDependencies>false</WindowsAppSDKVerifyTransitiveDependencies>', '');
    expect(without).not.toContain('WindowsAppSDKVerifyTransitiveDependencies');
    const again = patchExperimentalFeatures(without);
    expect(again).toContain('<RnwNewArch>true</RnwNewArch>\n    <WindowsAppSDKVerifyTransitiveDependencies>false</WindowsAppSDKVerifyTransitiveDependencies>\n    <!--');
    expect(again.split('expo-windows: library projects').length - 1).toBe(1);
    expect(again.split('<UseFabric>true</UseFabric>').length - 1).toBe(1);
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

describe('patchSingleInstance', () => {
  const ENTRY = [
    '#include "pch.h"',
    '#include "DropFiles.h"',
    '',
    'int CALLBACK WinMain(HINSTANCE, HINSTANCE, PSTR, int) {',
    '  winrt::init_apartment(winrt::apartment_type::single_threaded);',
    '  auto app = Build();',
    '}',
    '',
  ].join('\n');

  it('redirects a second launch to the running instance right after the apartment is up, once', () => {
    const patched = patchSingleInstance(ENTRY);
    const lines = patched.split('\n');
    expect(lines[0]).toBe('#include "pch.h"');
    expect(lines[1]).toBe('#include <winrt/Microsoft.Windows.AppLifecycle.h>');
    const apartment = lines.findIndex(line => line.includes('winrt::init_apartment'));
    const redirect = lines.findIndex(line => line.includes('FindOrRegisterForKey(L"main")'));
    const build = lines.findIndex(line => line.includes('auto app = Build();'));
    expect(apartment).toBeGreaterThan(1);
    expect(redirect).toBeGreaterThan(apartment);
    expect(build).toBeGreaterThan(redirect);
    expect(patched).toContain('RedirectActivationToAsync(');
    expect(patched).toContain('CoWaitForMultipleObjects(');
    expect(patchSingleInstance(patched)).toBe(patched);
  });

  it('leaves an entry without the template\'s apartment line alone, and adds the include at the top without a pch', () => {
    expect(patchSingleInstance('int main() { return 0; }\n')).toBe('int main() { return 0; }\n');
    const bare = 'int WinMain() {\n  winrt::init_apartment();\n  return 0;\n}\n';
    const patched = patchSingleInstance(bare);
    expect(patched.startsWith('#include <winrt/Microsoft.Windows.AppLifecycle.h>\nint WinMain() {')).toBe(true);
    expect(patched).toContain('FindOrRegisterForKey');
  });

  it('adds no second include to an entry that has it already', () => {
    const entry = '#include <winrt/Microsoft.Windows.AppLifecycle.h>\nint WinMain() {\n  winrt::init_apartment();\n  return 0;\n}\n';
    const patched = patchSingleInstance(entry);
    expect(patched.split('Microsoft.Windows.AppLifecycle.h').length - 1).toBe(1);
    expect(patched).toContain('FindOrRegisterForKey');
  });
});
