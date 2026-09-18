// @ts-check
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {CAPABILITIES, RUNTIME_PUBLISHER, TILES, appInstallerFor, copyLayout, fourPartVersion, identityName, isShipped, manifestFor, packageOf, sdkTool, selfSignedScript, writeTiles} = require('./package');

describe('identityName and fourPartVersion', () => {
  it('makes a package identity name from an app name', () => {
    expect(identityName('Drop Files')).toBe('DropFiles');
    expect(identityName('contoso.drop-files')).toBe('Contoso.dropFiles');
    expect(identityName('3d viewer')).toBe('DViewer');
    expect(identityName('!!')).toBe('App');
    expect(identityName('ab')).toBe('AbApp');
    expect(identityName('x'.repeat(60))).toHaveLength(50);
  });

  it('pads and clamps a version to four parts', () => {
    expect(fourPartVersion('1.2.3')).toBe('1.2.3.0');
    expect(fourPartVersion('1.2')).toBe('1.2.0.0');
    expect(fourPartVersion('1.2.3.4')).toBe('1.2.3.4');
    expect(fourPartVersion('1.2.3.4.5')).toBe('1.2.3.4');
    expect(fourPartVersion('70000.0.0')).toBe('65535.0.0.0');
    expect(fourPartVersion('next')).toBe('1.0.0.0');
    expect(fourPartVersion(undefined)).toBe('1.0.0.0');
  });
});

describe('packageOf', () => {
  it('reads the identity from the Expo config with sensible defaults', () => {
    const pkg = packageOf({name: 'Drop Files', slug: 'dropfiles', version: '1.0.0', scheme: 'dropfiles'});
    expect(pkg).toEqual({
      name: 'DropFiles',
      publisher: 'CN=Developer',
      publisherDisplayName: 'Developer',
      version: '1.0.0.0',
      displayName: 'Drop Files',
      description: 'Drop Files',
      schemes: ['dropfiles'],
      capabilities: ['internetClient', 'runFullTrust'],
      language: 'en-US',
      runtime: '1.8',
    });
    expect(packageOf({slug: 'drop-files'}).displayName).toBe('DropFiles');
    expect(packageOf({name: 'App', owner: 'contoso'}).publisher).toBe('CN=contoso');
    expect(packageOf({name: 'App', scheme: ['one', 'two', 3]}).schemes).toEqual(['one', 'two']);
    expect(packageOf({name: 'App'}).schemes).toEqual([]);
  });

  it('takes extra.windows and the options over the defaults, and refuses a capability it does not know', () => {
    const config = {
      name: 'Drop Files',
      version: '2.3.4',
      description: 'Drops files',
      extra: {windows: {packageName: 'Contoso.DropFiles', publisher: 'CN=Contoso, O=Contoso', publisherDisplayName: 'Contoso', version: '2.3.4.7', capabilities: ['webcam', 'internetClient'], language: 'de-DE', runtime: '1.9'}},
    };
    const pkg = packageOf(config);
    expect(pkg.name).toBe('Contoso.DropFiles');
    expect(pkg.publisher).toBe('CN=Contoso, O=Contoso');
    expect(pkg.publisherDisplayName).toBe('Contoso');
    expect(pkg.version).toBe('2.3.4.7');
    expect(pkg.description).toBe('Drops files');
    expect(pkg.capabilities).toEqual(['internetClient', 'runFullTrust', 'webcam']);
    expect(pkg.language).toBe('de-DE');
    expect(pkg.runtime).toBe('1.9');
    expect(packageOf(config, {publisher: 'CN=Other', runtime: '2.0'})).toMatchObject({publisher: 'CN=Other', runtime: '2.0'});
    expect(() => packageOf({name: 'App', extra: {windows: {capabilities: ['telepathy']}}})).toThrow(/telepathy/);
  });
});

describe('manifestFor', () => {
  it('writes a full-trust desktop package over the Windows App Runtime, with the tiles, protocols and capabilities', () => {
    const pkg = packageOf({name: 'Drop & Files', version: '1.2.3', scheme: ['dropfiles', 'drop-files'], extra: {windows: {capabilities: ['webcam', 'picturesLibrary', 'broadFileSystemAccess']}}});
    const xml = manifestFor(pkg, 'DropFiles.exe');
    expect(xml).toContain('<Identity Name="DropFiles" Publisher="CN=Developer" Version="1.2.3.0" ProcessorArchitecture="x64" />');
    expect(xml).toContain('<DisplayName>Drop &amp; Files</DisplayName>');
    expect(xml).toContain(`<PackageDependency Name="Microsoft.WindowsAppRuntime.1.8" MinVersion="8000.0.0.0" Publisher="${RUNTIME_PUBLISHER}" />`);
    expect(xml).toContain('<Application Id="App" Executable="DropFiles.exe" EntryPoint="Windows.FullTrustApplication">');
    expect(xml).toContain('<uap:Protocol Name="dropfiles">');
    expect(xml).toContain('<uap:Protocol Name="drop-files">');
    expect(xml).toContain('<Capability Name="internetClient" />');
    expect(xml).toContain('<rescap:Capability Name="runFullTrust" />');
    expect(xml).toContain('<DeviceCapability Name="webcam" />');
    expect(xml).toContain('<uap:Capability Name="picturesLibrary" />');
    expect(xml).toContain('<rescap:Capability Name="broadFileSystemAccess" />');
    expect(xml).toContain('<Resource Language="en-US" />');
    for (const tile of ['Square150x150Logo', 'Square44x44Logo', 'Wide310x150Logo', 'SplashScreen', 'StoreLogo']) expect(xml).toContain(`Images\\${tile}.png`);
    // No scheme, no extensions element.
    expect(manifestFor(packageOf({name: 'App'}), 'App.exe')).not.toContain('<Extensions>');
    expect(Object.keys(CAPABILITIES)).toContain('microphone');
  });
});

describe('the layout', () => {
  it("copies the Release output without the build's own files", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-package-'));
    const from = path.join(root, 'Release');
    fs.mkdirSync(path.join(from, 'Bundle', 'assets'), {recursive: true});
    for (const file of ['App.exe', 'App.pdb', 'ExpoWindows.dll', 'ExpoWindows.lib', 'ExpoWindows.exp', 'ExpoWindows.winmd', 'ExpoWindows.pri', 'build.log']) fs.writeFileSync(path.join(from, file), file);
    fs.writeFileSync(path.join(from, 'Bundle', 'index.windows.bundle'), 'js');
    fs.writeFileSync(path.join(from, 'Bundle', 'assets', 'a.png'), 'png');
    fs.mkdirSync(path.join(from, 'sourcemaps', 'react'), {recursive: true});
    fs.writeFileSync(path.join(from, 'sourcemaps', 'react', 'index.windows.bundle.map'), 'map');
    const to = path.join(root, 'layout');
    fs.mkdirSync(to);
    fs.writeFileSync(path.join(to, 'stale.txt'), 'old');
    copyLayout(from, to);
    const files = fs.readdirSync(to).sort();
    expect(files).toEqual(['App.exe', 'Bundle', 'ExpoWindows.dll', 'ExpoWindows.pri', 'ExpoWindows.winmd']);
    expect(fs.existsSync(path.join(to, 'Bundle', 'assets', 'a.png'))).toBe(true);
    expect(isShipped('x.pdb')).toBe(false);
    expect(isShipped('x.DLL')).toBe(true);
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('renders the tiles from the icon', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-tiles-'));
    const icon = path.join(__dirname, '..', '..', 'example', 'assets', 'images', 'icon.png');
    await writeTiles(path.join(__dirname, '..', '..'), icon, path.join(root, 'Images'));
    const written = fs.readdirSync(path.join(root, 'Images')).sort();
    expect(written).toEqual(TILES.map(tile => tile.name).sort());
    // A PNG, as the manifest names them.
    expect(fs.readFileSync(path.join(root, 'Images', 'StoreLogo.png')).subarray(1, 4).toString()).toBe('PNG');
    fs.rmSync(root, {recursive: true, force: true});
  }, 60000);
});

describe('appInstallerFor', () => {
  it('points App Installer at the package on its URL and asks for updates at launch and in the background', () => {
    const pkg = packageOf({name: 'Drop Files', version: '1.2.3', extra: {windows: {publisher: 'CN=Contoso & Co'}}});
    const xml = appInstallerFor(pkg, 'https://downloads.contoso.com/dropfiles', 'DropFiles_1.2.3.0_x64.msix');
    expect(xml).toContain('<AppInstaller xmlns="http://schemas.microsoft.com/appx/appinstaller/2018" Version="1.2.3.0" Uri="https://downloads.contoso.com/dropfiles/DropFiles.appinstaller">');
    expect(xml).toContain('<MainPackage Name="DropFiles" Publisher="CN=Contoso &amp; Co" Version="1.2.3.0" ProcessorArchitecture="x64" Uri="https://downloads.contoso.com/dropfiles/DropFiles_1.2.3.0_x64.msix" />');
    expect(xml).toContain('<OnLaunch HoursBetweenUpdateChecks="0"');
    expect(xml).toContain('<AutomaticBackgroundTask />');
    expect(appInstallerFor(pkg, 'https://downloads.contoso.com/dropfiles/', 'a.msix', 'arm64')).toContain('ProcessorArchitecture="arm64" Uri="https://downloads.contoso.com/dropfiles/a.msix"');
  });
});

describe('the tools', () => {
  it("finds the newest SDK's copy of a tool, and says what to install without one", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-windows-kits-'));
    for (const version of ['10.0.19041.0', '10.0.22621.0', 'notes']) fs.mkdirSync(path.join(root, 'bin', version, 'x64'), {recursive: true});
    fs.writeFileSync(path.join(root, 'bin', '10.0.19041.0', 'x64', 'makeappx.exe'), '');
    fs.writeFileSync(path.join(root, 'bin', '10.0.22621.0', 'x64', 'makeappx.exe'), '');
    fs.writeFileSync(path.join(root, 'bin', '10.0.19041.0', 'x64', 'signtool.exe'), '');
    expect(sdkTool('makeappx', root)).toBe(path.join(root, 'bin', '10.0.22621.0', 'x64', 'makeappx.exe'));
    expect(sdkTool('signtool', root)).toBe(path.join(root, 'bin', '10.0.19041.0', 'x64', 'signtool.exe'));
    expect(() => sdkTool('mt', root)).toThrow(/Windows 11 SDK/);
    expect(() => sdkTool('makeappx', path.join(root, 'nowhere'))).toThrow(/makeappx/);
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('writes the PowerShell for a self-signed certificate matching the publisher', () => {
    const script = selfSignedScript("CN=O'Neil", 'C:\\out\\app.pfx', 'C:\\out\\app.cer', 'secret');
    expect(script).toContain("New-SelfSignedCertificate -Type Custom -Subject 'CN=O''Neil'");
    expect(script).toContain('1.3.6.1.5.5.7.3.3');
    expect(script).toContain("Export-PfxCertificate -Cert $cert -FilePath 'C:\\out\\app.pfx'");
    expect(script).toContain("Export-Certificate -Cert $cert -FilePath 'C:\\out\\app.cer'");
    expect(script).toContain("-String 'secret'");
  });
});
