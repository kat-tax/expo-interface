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
 * The bundle command react-native-windows' Release build runs: the runtime's
 * own, which hands the target's arguments to Expo's exporter (see
 * `./bundle.js`); the template's default is the React Native CLI's bundle
 * command, which an Expo app does not carry and which starts from an
 * `index.js` the app does not have.
 */
const BUNDLE_COMMAND = 'npx expo-windows bundle';

/**
 * The project file, set to build an unpackaged app that bootstraps the
 * Windows App Runtime itself — the template leaves
 * `WindowsAppSdkAutoInitialize` off, which is right for a packaged app and
 * aborts an unpackaged one before its first line — and to bundle through
 * Expo's exporter in a Release build.
 * @param {string} vcxproj
 */
function patchVcxproj(vcxproj) {
  let text = setProjectProperty(vcxproj, 'WindowsPackageType', 'None');
  text = setProjectProperty(text, 'WindowsAppSdkAutoInitialize', 'true');
  text = setProjectProperty(text, 'BundleCliCommand', BUNDLE_COMMAND);
  return text;
}

/** The lines the smoke patch adds after the instance settings, indented as that line is. */
const SMOKE_LINES = [
  '// expo-windows: a smoke run (EXPO_WINDOWS_SMOKE names a file) writes whether the bundle loaded there,',
  '// with the milliseconds since the process started and the working set in kilobytes, and exits.',
  '{',
  '  wchar_t smoke[MAX_PATH]{};',
  '  if (GetEnvironmentVariableW(L"EXPO_WINDOWS_SMOKE", smoke, MAX_PATH) > 0) {',
  '    std::wstring smokeFile{smoke};',
  '    settings.InstanceLoaded([smokeFile](auto const &, winrt::Microsoft::ReactNative::InstanceLoadedEventArgs const &args) {',
  '      FILETIME created{}, exited{}, kernel{}, user{}, now{};',
  '      GetProcessTimes(GetCurrentProcess(), &created, &exited, &kernel, &user);',
  '      GetSystemTimeAsFileTime(&now);',
  '      ULARGE_INTEGER start{}, current{};',
  '      start.LowPart = created.dwLowDateTime;',
  '      start.HighPart = created.dwHighDateTime;',
  '      current.LowPart = now.dwLowDateTime;',
  '      current.HighPart = now.dwHighDateTime;',
  '      PROCESS_MEMORY_COUNTERS memory{};',
  '      memory.cb = sizeof(memory);',
  '      GetProcessMemoryInfo(GetCurrentProcess(), &memory, sizeof(memory));',
  '      char text[96]{};',
  '      int length = std::snprintf(text, sizeof(text), "%s %llu %llu", args.Failed() ? "failed" : "loaded",',
  '          static_cast<unsigned long long>((current.QuadPart - start.QuadPart) / 10000ULL), static_cast<unsigned long long>(memory.WorkingSetSize / 1024));',
  '      HANDLE handle = CreateFileW(smokeFile.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);',
  '      if (handle != INVALID_HANDLE_VALUE) {',
  '        DWORD written = 0;',
  '        WriteFile(handle, text, static_cast<DWORD>(length > 0 ? length : 0), &written, nullptr);',
  '        CloseHandle(handle);',
  '      }',
  '      ExitProcess(args.Failed() ? 1 : 0);',
  '    });',
  '  }',
  '}',
];

/** What the smoke block needs beyond the template's headers: the process memory counters and snprintf. */
const SMOKE_INCLUDES = ['#include <psapi.h>', '#include <cstdio>'];

/**
 * The app's entry with a smoke run: launched with `EXPO_WINDOWS_SMOKE`
 * naming a file, the app writes whether its bundle loaded there
 * (react-native-windows' `InstanceLoaded` event), with the milliseconds
 * since the process started and its working set in kilobytes, and exits —
 * how CI proves a Release build starts on a machine that never ran Metro,
 * and has numbers to hold a regression to. Added after the template's
 * instance-settings line, with the headers it needs after the pch; an
 * entry without that line, or with the patch already, is left as it is.
 * @param {string} text
 */
function patchSmoke(text) {
  if (text.includes('EXPO_WINDOWS_SMOKE')) return text;
  const settings = /^([ \t]*)auto settings\{.*InstanceSettings\(\)\};[ \t]*$/m.exec(text);
  if (!settings) return text;
  const indent = settings[1];
  const at = settings.index + settings[0].length;
  const block = SMOKE_LINES.map(line => `${indent}${line}`).join('\n');
  let patched = `${text.slice(0, at)}\n${block}${text.slice(at)}`;
  const includes = SMOKE_INCLUDES.filter(include => !patched.includes(include));
  if (includes.length) {
    const pch = /^#include "pch\.h"[^\n]*\n/m.exec(patched);
    const after = pch ? pch.index + pch[0].length : 0;
    patched = `${patched.slice(0, after)}${includes.join('\n')}\n${patched.slice(after)}`;
  }
  return patched;
}

const EXPERIMENTAL_FEATURES_NOTE = `
    <!--
      expo-windows: library projects from react-native-windows' 0.7x line
      (react-native-svg, async-storage) choose their New Architecture build
      by reading UseFabric at their first line, before react-native-windows
      derives it from RnwNewArch, so it is stated here too. And a library
      that still carries a packages.config trips the Windows App SDK's
      transitive-dependency check, which is for packages.config projects,
      while every project here restores through PackageReference.
    -->`;

const EXPERIMENTAL_FEATURES = [
  ['UseFabric', 'true'],
  ['WindowsAppSDKVerifyTransitiveDependencies', 'false'],
];

const NEW_ARCH = /<RnwNewArch>true<\/RnwNewArch>/;

/**
 * The app's `ExperimentalFeatures.props`, which every library project
 * imports first, with `UseFabric` stated for the libraries that read it
 * before react-native-windows derives it from `RnwNewArch`, and the Windows
 * App SDK's transitive-dependency check off for the ones that still carry a
 * packages.config. A property the app set otherwise is replaced; a missing
 * one is added after `RnwNewArch`, with the note once. A file without
 * `RnwNewArch` is not a New Architecture app's, and is refused.
 * @param {string} props
 */
function patchExperimentalFeatures(props) {
  if (!NEW_ARCH.test(props)) {
    throw new Error('ExperimentalFeatures.props does not set RnwNewArch: expo-windows needs a New Architecture app');
  }
  let text = props;
  const added = [];
  for (const [name, value] of EXPERIMENTAL_FEATURES) {
    const existing = new RegExp(`<${name}>[^<]*</${name}>`);
    if (existing.test(text)) text = text.replace(existing, `<${name}>${value}</${name}>`);
    else added.push(`\n    <${name}>${value}</${name}>`);
  }
  if (added.length === 0) return text;
  const anchor = /** @type {RegExpExecArray} */ (NEW_ARCH.exec(text));
  const at = anchor.index + anchor[0].length;
  const note = text.includes('expo-windows: library projects') ? '' : EXPERIMENTAL_FEATURES_NOTE;
  return `${text.slice(0, at)}${note}${added.join('')}${text.slice(at)}`;
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

const SINGLE_INSTANCE_INCLUDE = '#include <winrt/Microsoft.Windows.AppLifecycle.h>';

const SINGLE_INSTANCE = `
  // expo-windows: one instance. A link with the app's scheme, or a second launch,
  // reaches the running app (as React Native's \`url\` event) instead of opening
  // another window. The wait is a COM wait: this thread is a single-threaded
  // apartment, which a blocking get() would deadlock.
  {
    auto expoMainInstance = winrt::Microsoft::Windows::AppLifecycle::AppInstance::FindOrRegisterForKey(L"main");
    if (!expoMainInstance.IsCurrent()) {
      winrt::handle redirected{CreateEventW(nullptr, TRUE, FALSE, nullptr)};
      auto redirect = expoMainInstance.RedirectActivationToAsync(
          winrt::Microsoft::Windows::AppLifecycle::AppInstance::GetCurrent().GetActivatedEventArgs());
      redirect.Completed([&redirected](auto const &, auto const &) { SetEvent(redirected.get()); });
      DWORD signalled = 0;
      HANDLE handles[] = {redirected.get()};
      CoWaitForMultipleObjects(CWMO_DEFAULT, INFINITE, 1, handles, &signalled);
      return 0;
    }
  }
`;

/**
 * The app's C++ entry, made single-instance for deep links: right after the
 * apartment is initialized, a launch that is not the first hands its
 * activation — the URL — to the running instance and exits, and the
 * runtime's linking module raises it there. An entry the template did not
 * write (no `winrt::init_apartment` line) is left as it is, as is one
 * already patched.
 * @param {string} appCpp
 */
function patchSingleInstance(appCpp) {
  if (appCpp.includes('FindOrRegisterForKey')) return appCpp;
  const anchor = /^[ \t]*winrt::init_apartment\([^\n]*\n/m.exec(appCpp);
  if (!anchor) return appCpp;
  const at = anchor.index + anchor[0].length;
  let text = `${appCpp.slice(0, at)}${SINGLE_INSTANCE}${appCpp.slice(at)}`;
  if (!text.includes(SINGLE_INSTANCE_INCLUDE)) {
    const include = /^#include "pch\.h"[^\n]*\n/m.exec(text);
    const after = include ? include.index + include[0].length : 0;
    text = `${text.slice(0, after)}${SINGLE_INSTANCE_INCLUDE}\n${text.slice(after)}`;
  }
  return text;
}

module.exports = {safeProjectName, setProjectProperty, patchVcxproj, patchExperimentalFeatures, patchAppCpp, patchSingleInstance, patchSmoke};
