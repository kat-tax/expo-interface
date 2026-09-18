// @ts-check
/**
 * The MSBuild properties `expo-windows run` gives react-native-windows'
 * `run-windows`, through its `--msbuildprops` option.
 */

const path = require('node:path');

/**
 * The target SDK react-native-windows 0.84's New Architecture pins the app
 * to. Passed as a global property so that a library project asking for the
 * latest SDK installed (react-native-svg's does) builds metadata the app can
 * reference: a WinMD for a newer SDK than the app's is dropped from the
 * app's references, and the app's autolinked include of it fails.
 */
const TARGET_SDK = 'WindowsTargetPlatformVersion=10.0.22621.0';

/** The version TARGET_SDK names. */
const PINNED_SDK = '10.0.22621.0';

/**
 * The target SDK as this machine has it: the pinned one when it is
 * installed, else the newest Windows 10/11 SDK there is (a Visual Studio
 * 2026 image ships a newer one only), else the pinned one for MSBuild to
 * complain about. `root` is the Windows Kits folder.
 * @param {string} [root]
 * @returns {string} an MSBuild property, `WindowsTargetPlatformVersion=<version>`
 */
function installedTargetSdk(root = path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Windows Kits', '10')) {
  const fs = require('node:fs');
  const include = path.join(root, 'Include');
  /** @type {string[]} */
  let versions = [];
  try {
    versions = fs.readdirSync(include).filter(entry => /^10\.0\.\d+\.0$/.test(entry));
  } catch {
    versions = [];
  }
  if (versions.includes(PINNED_SDK) || versions.length === 0) return TARGET_SDK;
  const newest = versions.sort((a, b) => Number(a.split('.')[2]) - Number(b.split('.')[2])).at(-1);
  return `WindowsTargetPlatformVersion=${newest}`;
}

/**
 * The `run-windows` arguments with the target SDK among the MSBuild
 * properties: added to a `--msbuildprops` the caller passed (in either of
 * its spellings, with the value beside or after it) unless it names the
 * property already, or as one of its own.
 * @param {string[]} args
 * @param {string} [sdk] the property to add; the installed target SDK by default
 */
function withTargetSdk(args, sdk = installedTargetSdk()) {
  const at = args.findIndex(arg => arg === '--msbuildprops' || arg.startsWith('--msbuildprops='));
  if (at < 0) return [...args, '--msbuildprops', sdk];
  const inline = args[at].includes('=');
  const beside = !inline && at + 1 < args.length && !args[at + 1].startsWith('-');
  const value = inline ? args[at].slice('--msbuildprops='.length) : beside ? args[at + 1] : '';
  if (/(^|,)WindowsTargetPlatformVersion=/.test(value)) return args;
  const joined = value ? `${value},${sdk}` : sdk;
  const next = [...args];
  if (inline) {
    next[at] = `--msbuildprops=${joined}`;
  } else if (beside) {
    next[at + 1] = joined;
  } else {
    next.splice(at + 1, 0, joined);
  }
  return next;
}

/**
 * MSBuild, as Visual Studio's installer locates it (`vswhere`), for the
 * commands that build without `run-windows` — which, on the 0.84 line, asks
 * for a Visual Studio newer than the one that builds the project.
 * @param {(command: string, args: string[]) => string} [query] runs a program and returns its output; `vswhere` by default
 * @returns {string} the path of MSBuild.exe
 */
function findMsBuild(query = runVswhere) {
  const vswhere = path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
  const found = query(vswhere, ['-latest', '-products', '*', '-requires', 'Microsoft.Component.MSBuild', '-find', 'MSBuild\\**\\Bin\\MSBuild.exe'])
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean);
  if (!found) throw new Error('MSBuild was not found: install Visual Studio with the C++ desktop workload');
  return found;
}

/**
 * @param {string} command
 * @param {string[]} args
 */
function runVswhere(command, args) {
  const {spawnSync} = require('node:child_process');
  const result = spawnSync(command, args, {encoding: 'utf8'});
  return result.status === 0 ? result.stdout : '';
}

module.exports = {TARGET_SDK, installedTargetSdk, withTargetSdk, findMsBuild};
