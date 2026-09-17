#!/usr/bin/env node
// @ts-check
/**
 * `expo-windows`: the app scaffold for an Expo app on react-native-windows.
 *
 *     expo-windows init [--overwrite] [--cli-version <version>]
 *     expo-windows run [--release] [--no-packager] [-- <run-windows args>]
 *     expo-windows bundle [--dev]
 *
 * `init` writes `windows/` with react-native-windows' `cpp-app` template
 * (through the React Native community CLI, fetched on demand since an Expo
 * app does not carry it) and patches the result to run as an Expo app: an
 * unpackaged build that bootstraps the Windows App Runtime, the entry
 * pointed at the `main` component `expo` registers. `run` starts
 * `expo start` and builds and launches the app with `run-windows`. `bundle`
 * writes the release JavaScript and assets into the project with
 * `expo export:embed`, which the release build's MSBuild bundle target
 * expects there.
 */
const {spawn, spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {withTargetSdk} = require('./msbuild');
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
  const packager = !args.includes('--no-packager');
  const metro = packager ? spawn(npx, ['expo', 'start'], {cwd: projectRoot, stdio: 'inherit', shell: process.platform === 'win32'}) : null;
  const release = args.includes('--release') ? ['--release'] : [];
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
  run(npx, [
    'expo',
    'export:embed',
    '--platform',
    'windows',
    '--dev',
    args.includes('--dev') ? 'true' : 'false',
    '--bundle-output',
    path.join(output, 'index.windows.bundle'),
    '--assets-dest',
    output,
  ]);
  console.log(`bundle written to ${path.relative(projectRoot, output)}`);
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
  default:
    console.log('usage: expo-windows <init|run|bundle> [options]');
    process.exit(command ? 1 : 0);
}
