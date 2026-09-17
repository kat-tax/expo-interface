// @ts-check
const {patchAppCpp, patchSingleInstance, patchVcxproj, safeProjectName, setProjectProperty} = require('./patch');

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
