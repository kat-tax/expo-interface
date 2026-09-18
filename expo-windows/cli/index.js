#!/usr/bin/env node
// @ts-check
/**
 * `expo-windows`: the app scaffold for an Expo app on react-native-windows.
 *
 *     expo-windows init [--overwrite] [--cli-version <version>]
 *     expo-windows run [--release] [--no-packager] [-- <run-windows args>]
 *     expo-windows bundle [--dev] [<the MSBuild bundle target's arguments>]
 *     expo-windows package [--no-build] [--self-signed | --cert <pfx> [--password <text>]] [--publisher <CN=...>] [--toolset <v143>] [--appinstaller <url>]
 *
 * `init` writes `windows/` with react-native-windows' `cpp-app` template
 * (through the React Native community CLI, fetched on demand since an Expo
 * app does not carry it) and patches the result to run as an Expo app: an
 * unpackaged build that bootstraps the Windows App Runtime, the entry
 * pointed at the `main` component `expo` registers, the Release build's
 * bundle command pointed at `bundle`. `run` starts `expo start` and builds
 * and launches the app with `run-windows`; with `--release` the app carries
 * its bundle and needs no server. `bundle` writes the JavaScript and assets
 * into the project with `expo export:embed` — by hand ahead of a build, or
 * as the Release build's MSBuild bundle target, whose arguments it takes
 * (see ./bundle.js); the target then compiles the bundle to Hermes bytecode.
 */
const {spawn, spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {exportArgs} = require('./bundle');
const {findMsBuild, installedTargetSdk, withTargetSdk} = require('./msbuild');
const {appInstallerFor, copyLayout, manifestFor, packageOf, sdkTool, selfSignedScript, writeTiles} = require('./package');
const {safeProjectName} = require('./patch');
const {applyPatches, ensureScreensExclusion, findProject, keepMetroConfig} = require('./project');

const projectRoot = process.cwd();
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

/**
 * @param {string[]} args
 * @param {string} name
 */
function flag(args, name) {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
}

/** The app's name and slug from the Expo config, or the folder's name. */
function appName() {
  try {
    const {getConfig} = require('expo/config');
    const {exp} = getConfig(projectRoot, {skipSDKVersionRequirement: true});
    return exp.name || exp.slug || path.basename(projectRoot);
  } catch {
    return path.basename(projectRoot);
  }
}

/**
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
  const result = spawnSync(command, args, {cwd: projectRoot, stdio: 'inherit', shell: process.platform === 'win32'});
  if (result.status !== 0) {
    console.error(`${command} ${args.join(' ')} failed with ${result.status ?? result.signal}`);
    process.exit(result.status ?? 1);
  }
}

/** @param {string[]} args */
function init(args) {
  if (findProject(projectRoot) && !args.includes('--overwrite')) {
    console.log('windows/ already has a project; pass --overwrite to write it again');
    return;
  }
  try {
    require.resolve('react-native-windows/package.json', {paths: [projectRoot]});
  } catch {
    console.error('react-native-windows is not installed: add the version that matches your react-native, then run init again');
    process.exit(1);
  }
  const name = safeProjectName(appName());
  const exclusion = ensureScreensExclusion(projectRoot);
  if (exclusion === 'kept') {
    console.log('react-native.config.js exists: keep react-native-screens and @react-native-community/netinfo out of Windows autolinking in it (see the README)');
  }
  const cli = `@react-native-community/cli@${flag(args, '--cli-version') ?? 'latest'}`;
  // init-windows writes react-native-windows' own metro.config.js over the app's: the app's is kept.
  const restoreMetroConfig = keepMetroConfig(projectRoot);
  run(npx, ['--yes', cli, 'init-windows', '--template', 'cpp-app', '--name', name, '--namespace', name, '--overwrite', '--logging']);
  const metro = restoreMetroConfig();
  const {changed} = applyPatches(projectRoot);
  const notes = [
    exclusion === 'written' ? 'react-native.config.js written' : '',
    metro === 'restored' ? 'metro.config.js kept as it was' : metro === 'written' ? 'metro.config.js written with withWindows' : '',
  ].filter(Boolean);
  console.log(`windows/${name} written; patched ${changed.length ? changed.join(', ') : 'nothing'}${notes.length ? `; ${notes.join('; ')}` : ''}`);
}

/** @param {string[]} args */
function runApp(args) {
  // With the target SDK among the MSBuild properties: see ./msbuild.js.
  const passthrough = withTargetSdk(args.includes('--') ? args.slice(args.indexOf('--') + 1) : []);
  // A Release build carries its bundle: no server.
  const release = args.includes('--release') ? ['--release'] : [];
  const packager = !args.includes('--no-packager') && release.length === 0;
  const metro = packager ? spawn(npx, ['expo', 'start'], {cwd: projectRoot, stdio: 'inherit', shell: process.platform === 'win32'}) : null;
  run(npx, ['--yes', `@react-native-community/cli@${flag(args, '--cli-version') ?? 'latest'}`, 'run-windows', '--no-packager', '--logging', ...release, ...passthrough]);
  if (metro) {
    console.log('The app is running against the Metro server above; stop it with Ctrl+C when you are done.');
    metro.on('exit', code => process.exit(code ?? 0));
  }
}

/** @param {string[]} args */
function bundle(args) {
  const project = findProject(projectRoot);
  if (!project) {
    console.error('No windows/ project: run `expo-windows init` first');
    process.exit(1);
  }
  const output = path.join(project.dir, 'Bundle');
  fs.mkdirSync(output, {recursive: true});
  const exported = exportArgs(projectRoot, args, {bundleOutput: path.join(output, 'index.windows.bundle'), assetsDest: output});
  run(npx, ['expo', 'export:embed', ...exported]);
  console.log(`bundle written to ${path.relative(projectRoot, /** @type {string} */ (flag(exported, '--bundle-output')))}`);
}

/**
 * Runs a program by its path, with its arguments handed over as they are (no shell: the SDK's tools live under "Program Files").
 * @param {string} command
 * @param {string[]} args
 */
function runExe(command, args) {
  const result = spawnSync(command, args, {cwd: projectRoot, stdio: 'inherit'});
  if (result.status !== 0) {
    console.error(`${path.basename(command)} ${args.join(' ')} failed with ${result.status ?? result.signal}`);
    process.exit(result.status ?? 1);
  }
}

/** The app's Expo config, resolved (`app.json` or `app.config.js` with its plugins' additions). */
function expoConfig() {
  const {getConfig} = require('expo/config');
  return getConfig(projectRoot, {skipSDKVersionRequirement: true}).exp;
}

/**
 * The app as an MSIX under `windows/AppPackages/<name>/`: a Release build
 * (unless `--no-build`), its output as a layout with the manifest and tiles
 * from the Expo config, packed with the SDK's `makeappx`, signed with the
 * certificate given or a self-signed one made for the publisher (whose
 * `.cer` a machine imports into Trusted People before it installs the
 * package), or left unsigned for Developer Mode's `Add-AppxPackage -AllowUnsigned`.
 * @param {string[]} args
 */
async function packageApp(args) {
  const project = findProject(projectRoot);
  if (!project) {
    console.error('No windows/ project: run `expo-windows init` first');
    process.exit(1);
  }
  const config = expoConfig();
  const pkg = packageOf(config, {publisher: flag(args, '--publisher'), runtime: flag(args, '--runtime')});
  const platform = flag(args, '--platform') ?? 'x64';
  const output = path.join(projectRoot, 'windows', platform, 'Release');
  if (!args.includes('--no-build')) {
    const toolset = flag(args, '--toolset');
    runExe(findMsBuild(), [
      path.join('windows', `${project.name}.sln`),
      `-t:${project.name}`,
      '-restore',
      '-m',
      '-v:m',
      '-nologo',
      '-p:Configuration=Release',
      `-p:Platform=${platform}`,
      ...(toolset ? [`-p:PlatformToolset=${toolset}`] : []),
      `-p:${installedTargetSdk()}`,
      '-p:RunAutolinkCheck=false',
      '-p:RestorePackagesConfig=true',
    ]);
  }
  if (!fs.existsSync(path.join(output, `${project.name}.exe`))) {
    console.error(`No Release build at ${path.relative(projectRoot, output)}: build one, or drop --no-build`);
    process.exit(1);
  }
  const icon = typeof config.icon === 'string' ? path.resolve(projectRoot, config.icon) : null;
  if (!icon || !fs.existsSync(icon)) {
    console.error('The package needs an icon: set `expo.icon` to a PNG in app.json');
    process.exit(1);
  }
  const packages = path.join(projectRoot, 'windows', 'AppPackages', pkg.name);
  const layout = path.join(packages, 'layout');
  copyLayout(output, layout);
  await writeTiles(projectRoot, icon, path.join(layout, 'Images'));
  fs.writeFileSync(path.join(layout, 'AppxManifest.xml'), manifestFor(pkg, `${project.name}.exe`));
  const msix = path.join(packages, `${pkg.name}_${pkg.version}_${platform}.msix`);
  fs.rmSync(msix, {force: true});
  runExe(sdkTool('makeappx'), ['pack', '/d', layout, '/p', msix, '/o']);
  const cert = flag(args, '--cert');
  const notes = [`package ${path.relative(projectRoot, msix)} (${pkg.name} ${pkg.version}, publisher ${pkg.publisher})`];
  if (cert) {
    const password = flag(args, '--password');
    runExe(sdkTool('signtool'), ['sign', '/fd', 'SHA256', '/f', cert, ...(password ? ['/p', password] : []), msix]);
    notes.push(`signed with ${cert}`);
  } else if (args.includes('--self-signed')) {
    const pfx = path.join(packages, `${pkg.name}.pfx`);
    const cer = path.join(packages, `${pkg.name}.cer`);
    const password = 'expo-windows';
    // The script as an encoded command: no shell in between to take its quotes.
    runExe('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(selfSignedScript(pkg.publisher, pfx, cer, password), 'utf16le').toString('base64')]);
    runExe(sdkTool('signtool'), ['sign', '/fd', 'SHA256', '/f', pfx, '/p', password, msix]);
    notes.push(`signed with a self-signed certificate for ${pkg.publisher}; to install here, import ${path.relative(projectRoot, cer)} into the machine's Trusted People store (as an administrator: Import-Certificate -FilePath <cer> -CertStoreLocation Cert:\\LocalMachine\\TrustedPeople), then Add-AppxPackage <msix>`);
  } else {
    notes.push('unsigned: install with Developer Mode on (Add-AppxPackage -AllowUnsigned <msix>), or sign it with --cert or --self-signed');
  }
  const served = flag(args, '--appinstaller');
  if (served) {
    const installer = path.join(packages, `${pkg.name}.appinstaller`);
    fs.writeFileSync(installer, appInstallerFor(pkg, served, path.basename(msix), platform));
    notes.push(`${path.relative(projectRoot, installer)}: serve it and the package from ${served}; Windows installs from the .appinstaller and updates from there at launch and in the background`);
  }
  console.log(notes.join('\n'));
}

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case 'init':
    init(rest);
    break;
  case 'run':
    runApp(rest);
    break;
  case 'bundle':
    bundle(rest);
    break;
  case 'package':
    packageApp(rest).catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
    break;
  default:
    console.log('usage: expo-windows <init|run|bundle|package> [options]');
    process.exit(command ? 1 : 0);
}
