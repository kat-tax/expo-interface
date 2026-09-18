// @ts-check
/**
 * `expo-windows package`: the app as an MSIX from its Release build — the
 * Windows SDK's `makeappx` and `signtool` over a layout folder, with no
 * Visual Studio packaging project in the way. That project's component is
 * not in every Visual Studio, and it is not needed: the exe's WinRT
 * components (react-native-windows', the runtime's, the kit's) load by the
 * DLL named after their namespace beside the exe, packaged or not, and the
 * Windows App Runtime's bootstrapper stands down in a process that has
 * package identity, so the Release exe is the same either way.
 *
 * The manifest comes from the Expo config: the name, version, scheme (as a
 * protocol) and icon (rendered to the tile sizes), with the package's
 * identity, publisher, capabilities and language from `extra.windows`:
 *
 *     "extra": {"windows": {
 *       "packageName": "Contoso.DropFiles",     // Identity Name; the app's name, PascalCase, by default
 *       "publisher": "CN=Contoso",              // must match the signing certificate's subject
 *       "publisherDisplayName": "Contoso",
 *       "version": "1.2.3.0",                   // four parts; expo.version padded by default
 *       "capabilities": ["webcam", "microphone"],
 *       "language": "en-US",
 *       "runtime": "1.8"                        // the Windows App Runtime the package depends on
 *     }}
 */
const fs = require('node:fs');
const path = require('node:path');

/** The Windows App Runtime framework package's publisher. */
const RUNTIME_PUBLISHER = 'CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US';

/** The tiles a manifest names, rendered from the app's icon. */
const TILES = [
  {name: 'Square44x44Logo.png', width: 44, height: 44},
  {name: 'Square44x44Logo.targetsize-24_altform-unplated.png', width: 24, height: 24},
  {name: 'Square150x150Logo.png', width: 150, height: 150},
  {name: 'Wide310x150Logo.png', width: 310, height: 150},
  {name: 'StoreLogo.png', width: 50, height: 50},
  {name: 'SplashScreen.png', width: 620, height: 300},
];

/** Files of a Release output that are the build's, not the app's: symbols, import libraries, logs, and the bundle's source maps. */
const NOT_SHIPPED = /\.(pdb|lib|exp|ilk|iobj|ipdb|tlog|log|binlog)$|(^|[\\/])sourcemaps$/i;

/** The capabilities a manifest may declare, each under the element its kind takes. */
const CAPABILITIES = {
  internetClient: 'Capability',
  internetClientServer: 'Capability',
  privateNetworkClientServer: 'Capability',
  picturesLibrary: 'uap:Capability',
  videosLibrary: 'uap:Capability',
  musicLibrary: 'uap:Capability',
  documentsLibrary: 'uap:Capability',
  removableStorage: 'uap:Capability',
  userAccountInformation: 'uap:Capability',
  webcam: 'DeviceCapability',
  microphone: 'DeviceCapability',
  location: 'DeviceCapability',
  bluetooth: 'DeviceCapability',
  runFullTrust: 'rescap:Capability',
  broadFileSystemAccess: 'rescap:Capability',
};

/**
 * A package identity name from an app's name: letters, digits, dots and
 * dashes, starting with a letter, 3 to 50 characters — the app's words in
 * PascalCase. "Drop Files" becomes "DropFiles"; "3d viewer" "App3dViewer".
 * @param {string} text
 */
function identityName(text) {
  const pascal = text
    .split(/[^A-Za-z0-9.]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join('')
    .replace(/^[^A-Za-z]+/, '')
    .replace(/\.{2,}/g, '.')
    .replace(/\.$/, '');
  const name = pascal ? pascal[0].toUpperCase() + pascal.slice(1) : 'App';
  return (name.length < 3 ? `${name}App` : name).slice(0, 50);
}

/**
 * A four-part package version from a version string: "1.2.3" is "1.2.3.0",
 * anything unreadable "1.0.0.0"; each part within 0–65535.
 * @param {unknown} version
 */
function fourPartVersion(version) {
  const parts = String(version ?? '')
    .split('.')
    .map(part => parseInt(part, 10));
  if (!parts.length || parts.some(part => Number.isNaN(part))) return '1.0.0.0';
  return [0, 1, 2, 3].map(index => Math.min(Math.max(parts[index] ?? 0, 0), 65535)).join('.');
}

/**
 * @typedef {{
 *   name: string; publisher: string; publisherDisplayName: string; version: string;
 *   displayName: string; description: string; schemes: string[]; capabilities: string[];
 *   language: string; runtime: string;
 * }} PackageIdentity
 */

/**
 * What the manifest says, from the Expo config and the options given.
 * @param {Record<string, any>} config the Expo config (`exp`)
 * @param {{publisher?: string; runtime?: string}} [options]
 * @returns {PackageIdentity}
 */
function packageOf(config, options = {}) {
  const windows = (config.extra && typeof config.extra === 'object' && config.extra.windows) || {};
  const displayName = typeof config.name === 'string' && config.name ? config.name : identityName(String(config.slug ?? 'App'));
  const publisherDisplayName = windows.publisherDisplayName ?? config.owner ?? 'Developer';
  const publisher = options.publisher ?? windows.publisher ?? `CN=${publisherDisplayName}`;
  const schemes = Array.isArray(config.scheme) ? config.scheme.filter(item => typeof item === 'string') : typeof config.scheme === 'string' ? [config.scheme] : [];
  const capabilities = [...new Set(['internetClient', 'runFullTrust', ...(Array.isArray(windows.capabilities) ? windows.capabilities : [])])];
  for (const capability of capabilities) {
    if (!(capability in CAPABILITIES)) throw new Error(`Unknown Windows capability "${capability}": one of ${Object.keys(CAPABILITIES).join(', ')}`);
  }
  return {
    name: windows.packageName ?? identityName(displayName),
    publisher,
    publisherDisplayName,
    version: fourPartVersion(windows.version ?? config.version ?? '1.0.0'),
    displayName,
    description: typeof config.description === 'string' && config.description ? config.description : displayName,
    schemes,
    capabilities,
    language: windows.language ?? 'en-US',
    runtime: options.runtime ?? windows.runtime ?? '1.8',
  };
}

const XML_ESCAPES = /** @type {Record<string, string>} */ ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'});

/** @param {string} text */
function escapeXml(text) {
  return text.replace(/[<>&"']/g, char => XML_ESCAPES[char]);
}

/**
 * The package manifest (`AppxManifest.xml`) for the identity given and the
 * exe the layout carries: a full-trust desktop app depending on the Windows
 * App Runtime framework package, its tiles under `Images`, its schemes as
 * protocols.
 * @param {PackageIdentity} pkg
 * @param {string} executable the exe's file name in the layout
 */
function manifestFor(pkg, executable) {
  const x = escapeXml;
  const capabilities = pkg.capabilities.map(name => `    <${CAPABILITIES[/** @type {keyof typeof CAPABILITIES} */ (name)]} Name="${name}" />`).join('\n');
  const protocols = pkg.schemes
    .map(scheme => `        <uap:Extension Category="windows.protocol">\n          <uap:Protocol Name="${x(scheme)}">\n            <uap:DisplayName>${x(pkg.displayName)}</uap:DisplayName>\n          </uap:Protocol>\n        </uap:Extension>`)
    .join('\n');
  const extensions = protocols ? `      <Extensions>\n${protocols}\n      </Extensions>\n` : '';
  return `<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">
  <Identity Name="${x(pkg.name)}" Publisher="${x(pkg.publisher)}" Version="${pkg.version}" ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>${x(pkg.displayName)}</DisplayName>
    <PublisherDisplayName>${x(pkg.publisherDisplayName)}</PublisherDisplayName>
    <Logo>Images\\StoreLogo.png</Logo>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22621.0" />
    <PackageDependency Name="Microsoft.WindowsAppRuntime.${x(pkg.runtime)}" MinVersion="8000.0.0.0" Publisher="${RUNTIME_PUBLISHER}" />
  </Dependencies>
  <Resources>
    <Resource Language="${x(pkg.language)}" />
  </Resources>
  <Applications>
    <Application Id="App" Executable="${x(executable)}" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="${x(pkg.displayName)}"
        Description="${x(pkg.description)}"
        BackgroundColor="transparent"
        Square150x150Logo="Images\\Square150x150Logo.png"
        Square44x44Logo="Images\\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Images\\Wide310x150Logo.png" />
        <uap:SplashScreen Image="Images\\SplashScreen.png" />
      </uap:VisualElements>
${extensions}    </Application>
  </Applications>
  <Capabilities>
${capabilities}
  </Capabilities>
</Package>
`;
}

/**
 * Whether a file of the Release output belongs in the package.
 * @param {string} file
 */
function isShipped(file) {
  return !NOT_SHIPPED.test(file);
}

/**
 * The Release output copied into the layout folder, without the build's own
 * files; the folder is made afresh.
 * @param {string} from the Release output folder
 * @param {string} to the layout folder
 */
function copyLayout(from, to) {
  fs.rmSync(to, {recursive: true, force: true});
  fs.mkdirSync(to, {recursive: true});
  fs.cpSync(from, to, {recursive: true, filter: source => isShipped(source)});
}

/**
 * The tiles, rendered from the icon into the layout's `Images` folder
 * through `@expo/image-utils` as the app resolves it (it comes with Expo).
 * @param {string} projectRoot
 * @param {string} icon the icon's path
 * @param {string} imagesDir
 */
async function writeTiles(projectRoot, icon, imagesDir) {
  const {generateImageAsync} = require(require.resolve('@expo/image-utils', {paths: [projectRoot]}));
  fs.mkdirSync(imagesDir, {recursive: true});
  for (const tile of TILES) {
    const {source} = await generateImageAsync({projectRoot, cacheType: 'expo-windows-tiles'}, {src: icon, width: tile.width, height: tile.height, resizeMode: 'contain', backgroundColor: 'transparent', name: tile.name});
    fs.writeFileSync(path.join(imagesDir, tile.name), source);
  }
}

/**
 * A tool of the Windows SDK (`makeappx`, `signtool`): the newest SDK's x64
 * copy under the kits folder.
 * @param {string} name
 * @param {string} [root] the Windows Kits folder
 */
function sdkTool(name, root = path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Windows Kits', '10')) {
  const bin = path.join(root, 'bin');
  const versions = fs.existsSync(bin) ? fs.readdirSync(bin).filter(entry => /^10\.0\.\d+\.\d+$/.test(entry)) : [];
  const candidates = versions
    .sort((a, b) => compareVersions(b, a))
    .map(version => path.join(bin, version, 'x64', `${name}.exe`))
    .filter(file => fs.existsSync(file));
  if (!candidates.length) throw new Error(`${name}.exe was not found under ${bin}: install the Windows 11 SDK`);
  return candidates[0];
}

/**
 * @param {string} a
 * @param {string} b
 */
function compareVersions(a, b) {
  const as = a.split('.').map(Number);
  const bs = b.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = as[index] - bs[index];
    if (difference) return difference;
  }
  return as[3] - bs[3];
}

/**
 * The PowerShell that makes a self-signed code-signing certificate for the
 * publisher, in the user's store, and exports it as a PFX to sign with and
 * a CER to trust on a machine that installs the package.
 * @param {string} publisher the certificate's subject, the manifest's Publisher
 * @param {string} pfx
 * @param {string} cer
 * @param {string} password
 */
function selfSignedScript(publisher, pfx, cer, password) {
  const quote = (/** @type {string} */ text) => `'${text.replace(/'/g, "''")}'`;
  return [
    '$ErrorActionPreference = "Stop"',
    "$ProgressPreference = 'SilentlyContinue'",
    `$cert = New-SelfSignedCertificate -Type Custom -Subject ${quote(publisher)} -KeyUsage DigitalSignature -FriendlyName ${quote(`expo-windows ${publisher}`)} -CertStoreLocation Cert:\\CurrentUser\\My -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")`,
    `$password = ConvertTo-SecureString -String ${quote(password)} -Force -AsPlainText`,
    `Export-PfxCertificate -Cert $cert -FilePath ${quote(pfx)} -Password $password | Out-Null`,
    `Export-Certificate -Cert $cert -FilePath ${quote(cer)} | Out-Null`,
    'Write-Output $cert.Thumbprint',
  ].join('\n');
}

/**
 * The App Installer file (`.appinstaller`) for a package served from a
 * URL: Windows installs from it and, from then on, checks that URL for a
 * newer package at launch and in the background — the update channel an
 * MSIX has, where `expo-updates` has none on Windows. Both files are served
 * from `baseUrl`; the package's name is what `package` wrote.
 * @param {PackageIdentity} pkg
 * @param {string} baseUrl where the two files will be served from, ending in a slash or not
 * @param {string} msixName the package file's name
 * @param {string} [platform]
 */
function appInstallerFor(pkg, baseUrl, msixName, platform = 'x64') {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const x = escapeXml;
  return `<?xml version="1.0" encoding="utf-8"?>
<AppInstaller xmlns="http://schemas.microsoft.com/appx/appinstaller/2018" Version="${pkg.version}" Uri="${x(base)}${x(pkg.name)}.appinstaller">
  <MainPackage Name="${x(pkg.name)}" Publisher="${x(pkg.publisher)}" Version="${pkg.version}" ProcessorArchitecture="${x(platform)}" Uri="${x(base)}${x(msixName)}" />
  <UpdateSettings>
    <OnLaunch HoursBetweenUpdateChecks="0" ShowPrompt="false" UpdateBlocksActivation="false" />
    <AutomaticBackgroundTask />
    <ForceUpdateFromAnyVersion>true</ForceUpdateFromAnyVersion>
  </UpdateSettings>
</AppInstaller>
`;
}

module.exports = {TILES, CAPABILITIES, RUNTIME_PUBLISHER, identityName, fourPartVersion, packageOf, manifestFor, appInstallerFor, isShipped, copyLayout, writeTiles, sdkTool, selfSignedScript};
