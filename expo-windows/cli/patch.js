// @ts-check
/**
 * The edits `expo-windows init` makes to the project react-native-windows'
 * `cpp-app` template writes, so that it runs as an Expo app would. Pure
 * functions over the file text, so they can be tested without a template
 * and applied again after the template is regenerated.
 */

/**
 * A name MSBuild and C++ accept for the project and its namespace: the
 * app's name in PascalCase, letters and digits only, never starting with a
 * digit. "Drop Files" becomes "DropFiles"; "3d-viewer" becomes "App3dViewer".
 * @param {string} name
 */
function safeProjectName(name) {
  const pascal = name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join('');
  if (!pascal) return 'App';
  return /^[0-9]/.test(pascal) ? `App${pascal}` : pascal;
}

/**
 * Sets a property in the project file's first `<PropertyGroup>` that has a
 * `Label="Globals"`, or the first one at all, replacing the property where it
 * already exists at any level.
 * @param {string} vcxproj
 * @param {string} name
 * @param {string} value
 */
function setProjectProperty(vcxproj, name, value) {
  const existing = new RegExp(`<${name}>[^<]*</${name}>`);
  if (existing.test(vcxproj)) return vcxproj.replace(existing, `<${name}>${value}</${name}>`);
  const group = /<PropertyGroup Label="Globals">/.exec(vcxproj) ?? /<PropertyGroup>/.exec(vcxproj);
  if (!group) throw new Error(`No <PropertyGroup> to add ${name} to`);
  const at = group.index + group[0].length;
  return `${vcxproj.slice(0, at)}\n    <${name}>${value}</${name}>${vcxproj.slice(at)}`;
}

/**
 * The project file, set to build an unpackaged app that bootstraps the
 * Windows App Runtime itself: the template leaves
 * `WindowsAppSdkAutoInitialize` off, which is right for a packaged app and
 * aborts an unpackaged one before its first line.
 * @param {string} vcxproj
 */
function patchVcxproj(vcxproj) {
  let text = setProjectProperty(vcxproj, 'WindowsPackageType', 'None');
  text = setProjectProperty(text, 'WindowsAppSdkAutoInitialize', 'true');
  return text;
}

/**
 * The app's C++ entry, pointed at the component Expo registers: `expo`'s
 * `registerRootComponent` (and Expo Router's entry through it) registers
 * `main`, not the app's name. The bundle file stays `index`, which is what
 * `expo export:embed` writes.
 * @param {string} appCpp
 * @param {{componentName?: string}} [options]
 */
function patchAppCpp(appCpp, options = {}) {
  const componentName = options.componentName ?? 'main';
  const pattern = /(\.ComponentName\(L")[^"]*("\))/;
  if (!pattern.test(appCpp)) throw new Error('No ComponentName(L"…") call to point at the Expo root component');
  return appCpp.replace(pattern, `$1${componentName}$2`);
}

module.exports = {safeProjectName, setProjectProperty, patchVcxproj, patchAppCpp};
