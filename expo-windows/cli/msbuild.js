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

/**
 * The `run-windows` arguments with the target SDK among the MSBuild
 * properties: added to a `--msbuildprops` the caller passed (in either of
 * its spellings, with the value beside or after it) unless it names the
 * property already, or as one of its own.
 * @param {string[]} args
 */
function withTargetSdk(args) {
  const at = args.findIndex(arg => arg === '--msbuildprops' || arg.startsWith('--msbuildprops='));
  if (at < 0) return [...args, '--msbuildprops', TARGET_SDK];
  const inline = args[at].includes('=');
  const beside = !inline && at + 1 < args.length && !args[at + 1].startsWith('-');
  const value = inline ? args[at].slice('--msbuildprops='.length) : beside ? args[at + 1] : '';
  if (/(^|,)WindowsTargetPlatformVersion=/.test(value)) return args;
  const joined = value ? `${value},${TARGET_SDK}` : TARGET_SDK;
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

module.exports = {TARGET_SDK, withTargetSdk, findMsBuild};
