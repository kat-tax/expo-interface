// @ts-check
/**
 * The MSBuild properties `expo-windows run` gives react-native-windows'
 * `run-windows`, through its `--msbuildprops` option.
 */

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

module.exports = {TARGET_SDK, withTargetSdk};
