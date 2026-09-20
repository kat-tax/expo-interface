#!/usr/bin/env bash
# Builds an Expo app for Windows end to end on the line react-native-windows
# ships: the app's source in a scratch Expo 57 app (React Native pinned to the
# react-native-windows release), this checkout's runtime in its node_modules,
# `expo-windows init` writing and patching the Windows project the way `ios/`
# and `android/` are generated, autolinking, the Windows JavaScript bundle,
# MSBuild with the v143 toolset in Debug and Release, the package, and a smoke
# launch of the Release exe. What CI runs, and the fastest way to prove a
# change end to end.
#
#   ci/build.sh <workdir>
#
# With nothing else said it builds the runtime's own probe app (`ci/app`): a
# route for each part of the runtime, drawn with React Native's own views, so
# the runtime is proved without a UI kit. A library built on the runtime
# builds its own app over the same road:
#
#   APP_SOURCE          an app's folder; its `src`, `assets`, `app.json` and
#                       `tsconfig.json` stand in for the probe's
#   EXTRA_SOURCE        a folder copied over the app's `src`: more routes
#   EXTRA_DEPENDENCIES  `name@range` pairs the app needs and the scratch
#                       app's manifest lacks, separated by spaces
#   OVERLAY             `name=folder` pairs, separated by spaces: packages
#                       copied from a checkout into node_modules, as the
#                       runtime always is
#   EXPECT_LINKED       names autolinking must have registered besides the
#                       runtime's, separated by spaces
#   STOP_AFTER=bundle   stops once the JavaScript bundle is written: minutes
#                       rather than the better part of an hour, and no window
#
# Needs Node, npm, MSBuild (from a Visual Studio with the C++ desktop
# workload and the Windows 11 SDK; `msbuild` on the PATH or Visual Studio
# 2022 in its default place), and the PowerShell 7 and .NET SDK the
# react-native-windows CLI loads its commands through.
set -euo pipefail

RUNTIME_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${1:?workdir}"
CLI_VERSION="${CLI_VERSION:-20.1.0}"
APP_SOURCE="${APP_SOURCE:-}"
EXTRA_SOURCE="${EXTRA_SOURCE:-}"
EXTRA_DEPENDENCIES="${EXTRA_DEPENDENCIES:-}"
abs() { (cd "$1" && pwd); }
mkdir -p "$WORK"
WORK="$(abs "$WORK")"
APP="$WORK/WinCi"
[ -n "$APP_SOURCE" ] && APP_SOURCE="$(abs "$APP_SOURCE")"
[ -n "$EXTRA_SOURCE" ] && EXTRA_SOURCE="$(abs "$EXTRA_SOURCE")"
resolved=""
for pair in ${OVERLAY:-}; do resolved="$resolved ${pair%%=*}=$(abs "${pair#*=}")"; done
OVERLAY="expo-windows=$RUNTIME_DIR$resolved"
EXPECT_LINKED="ExpoWindows ${EXPECT_LINKED:-}"
STOP_AFTER="${STOP_AFTER:-}"

step() { printf '\n==== %s\n' "$1"; }

step "The scratch app, on the pinned line"
rm -rf "$APP"
mkdir -p "$APP"
cp -r "$RUNTIME_DIR/ci/app/." "$APP/"
if [ -n "$APP_SOURCE" ]; then
  echo "app: $APP_SOURCE"
  rm -rf "$APP/src" "$APP/assets" "$APP/app.json" "$APP/tsconfig.json"
  cp -r "$APP_SOURCE/src" "$APP/src"
  cp -r "$APP_SOURCE/assets" "$APP/assets"
  cp "$APP_SOURCE/app.json" "$APP/app.json"
  cp "$APP_SOURCE/tsconfig.json" "$APP/tsconfig.json"
else
  echo "app: the runtime's probe"
fi
if [ -n "$EXTRA_SOURCE" ]; then
  echo "more routes: $EXTRA_SOURCE"
  cp -r "$EXTRA_SOURCE/." "$APP/src/"
fi
cd "$APP"
# An app in a repository maps a package to its source beside it, and Expo's
# Metro follows tsconfig paths. The package is installed here, so its mapping
# goes. (Relative paths: Node on Windows reads a Git Bash path against the
# current drive.)
for pair in $OVERLAY; do
  OVERLAY_NAME="${pair%%=*}" node -e "
const fs = require('fs');
const t = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
const paths = t.compilerOptions && t.compilerOptions.paths;
if (paths && paths[process.env.OVERLAY_NAME]) {
  delete paths[process.env.OVERLAY_NAME];
  fs.writeFileSync('./tsconfig.json', JSON.stringify(t, null, 2) + '\n');
}
"
done
cat tsconfig.json

for dependency in $EXTRA_DEPENDENCIES; do
  # `@scope/name@range` splits at its last `@`.
  npm pkg set "dependencies.${dependency%@*}=${dependency##*@}"
done

# Another line than the template's, to smoke-run a new react-native-windows
# release: RN_VERSION and RNW_VERSION together, e.g. 0.85.3 and 0.85.0-preview.1.
if [ -n "${RN_VERSION:-}" ] || [ -n "${RNW_VERSION:-}" ]; then
  RN="${RN_VERSION:?RN_VERSION goes with RNW_VERSION}"
  RNW="${RNW_VERSION:?RNW_VERSION goes with RN_VERSION}"
  echo "line: react-native $RN, react-native-windows $RNW"
  npm pkg set "dependencies.react-native=$RN" "dependencies.react-native-windows=$RNW" \
    "dependencies.@react-native/new-app-screen=$RN" "devDependencies.@react-native/babel-preset=$RN" \
    "devDependencies.@react-native/metro-config=$RN" "devDependencies.@react-native/typescript-config=$RN"
fi

step "Install (the pinned line, peers relaxed for the Expo packages)"
npm install --legacy-peer-deps --no-audit --no-fund

step "The packages from their checkouts"
for pair in $OVERLAY; do
  pkg="${pair%%=*}"
  src="${pair#*=}"
  rm -rf "node_modules/$pkg"
  mkdir -p "node_modules/$pkg"
  cp "$src/package.json" "node_modules/$pkg/"
  cp -r "$src/src" "node_modules/$pkg/src"
  if [ -d "$src/windows" ]; then
    mkdir -p "node_modules/$pkg/windows"
    # The native library's sources and project, not any build output.
    (cd "$src/windows" && find . -type d \( -name x64 -o -name ARM64 -o -name Win32 -o -name obj -o -name 'Generated Files' -o -name bin \) -prune -o -type f -print) |
      while read -r f; do mkdir -p "node_modules/$pkg/windows/$(dirname "$f")"; cp "$src/windows/$f" "node_modules/$pkg/windows/$f"; done
  fi
  for f in react-native.config.js metro cli; do
    [ -e "$src/$f" ] && cp -r "$src/$f" "node_modules/$pkg/$f"
  done
  # Listed as a dependency after the install, since the checkout's version need
  # not be on npm: react-native-windows' autolinking reads the manifest to find
  # it, and so does the runtime, for the aliases a package contributes.
  version="$(PKG="$pkg" node -p "require('./node_modules/' + process.env.PKG + '/package.json').version")"
  npm pkg set "dependencies.$pkg=$version"
  echo "$pkg $version, from $src"
done
# The bin links an install would have made: the Release build runs the
# bundle through `npx expo-windows`, which looks for node_modules/.bin.
npm rebuild expo-windows --no-audit --no-fund
ls node_modules/.bin/expo-windows*

step "expo-windows init"
node node_modules/expo-windows/cli/index.js init --cli-version "$CLI_VERSION"

# The project's name, as init derived it from the app's name.
NAME="$(node -p "require('./node_modules/expo-windows/cli/project').findProject(process.cwd()).name")"
echo "project $NAME"

step "Autolink"
node node_modules/@react-native-community/cli/build/bin.js autolink-windows --sln "windows/$NAME.sln" --proj "windows/$NAME/$NAME.vcxproj" --logging
for library in $EXPECT_LINKED; do
  grep -q "$library" "windows/$NAME/AutolinkedNativeModules.g.cpp" || { echo "$library was not autolinked"; exit 1; }
  echo "linked: $library"
done
# The community packages with Windows ports of their own (async-storage's
# architecture-neutral TurboModule and react-native-svg's Fabric build) are
# autolinked and built here, so the app proves they compile and register on
# the pinned line; netinfo's project is from the Paper days and stays out,
# its package resolving to the runtime's network library instead.
grep -q "ReactNativeAsyncStorage" "windows/$NAME/AutolinkedNativeModules.g.cpp"
grep -q "RNSVG" "windows/$NAME/AutolinkedNativeModules.g.cpp"
! grep -q "NetInfo" "windows/$NAME/AutolinkedNativeModules.g.cpp"
# Nor is its Paper-era project in the solution, where it would drag react-native-windows' own project into the build.
! grep -q "RNCNetInfo" "windows/$NAME.sln"

step "The Windows JavaScript bundle"
node node_modules/expo-windows/cli/index.js bundle
ls -la "windows/$NAME/Bundle/index.windows.bundle"

if [ "$STOP_AFTER" = bundle ]; then
  step "Stopped after the bundle, as asked"
  exit 0
fi

step "MSBuild"
if command -v msbuild >/dev/null 2>&1; then
  MSBUILD=msbuild
else
  # As the CLI finds it: Visual Studio's installer says where MSBuild is
  # (a GitHub runner has the Enterprise edition, a desk the Community one).
  MSBUILD="$(cygpath -u "$(node -p "require('./node_modules/expo-windows/cli/msbuild').findMsBuild()")")"
fi
echo "msbuild: $MSBUILD"
# The target SDK is passed globally so that every project agrees on one: a
# library asking for the latest SDK installed (react-native-svg's does) then
# builds metadata the app can reference. It is the one react-native-windows
# 0.84 pins the app to when that is installed, else the newest there is (a
# GitHub runner's Visual Studio 2026 image ships a newer one only);
# WINDOWS_SDK names another. `expo-windows run` chooses the same way.
KITS="/c/Program Files (x86)/Windows Kits/10/Include"
SDK="${WINDOWS_SDK:-}"
if [ -z "$SDK" ]; then
  if [ -d "$KITS/10.0.22621.0" ]; then
    SDK=10.0.22621.0
  else
    SDK="$(ls "$KITS" 2>/dev/null | grep -E '^10\.0\.[0-9]+\.0$' | sort -t. -k3,3n | tail -1)"
  fi
fi
[ -n "$SDK" ] || { echo "no Windows SDK under $KITS"; exit 1; }
echo "target SDK: $SDK"
"$MSBUILD" "windows/$NAME.sln" -t:"$NAME" -restore -m -v:m -nologo \
  -p:Configuration=Debug -p:Platform=x64 -p:PlatformToolset="${TOOLSET:-v143}" \
  -p:WindowsTargetPlatformVersion="$SDK" \
  -p:RunAutolinkCheck=false -p:RestorePackagesConfig=true
ls -la "windows/x64/Debug/$NAME.exe"

step "MSBuild, Release"
# A Release build carries the JavaScript: react-native-windows' bundle target
# runs `expo-windows bundle` (init pointed it there), which hands the
# target's arguments to `expo export:embed`, then compiles the bundle to
# Hermes bytecode and copies the Bundle folder next to the exe.
"$MSBUILD" "windows/$NAME.sln" -t:"$NAME" -restore -m -v:m -nologo \
  -p:Configuration=Release -p:Platform=x64 -p:PlatformToolset="${TOOLSET:-v143}" \
  -p:WindowsTargetPlatformVersion="$SDK" \
  -p:RunAutolinkCheck=false -p:RestorePackagesConfig=true
ls -la "windows/x64/Release/$NAME.exe"
ls -la "windows/x64/Release/Bundle/index.windows.bundle"
# Hermes bytecode opens with its magic number.
[ "$(head -c 4 "windows/x64/Release/Bundle/index.windows.bundle" | od -A n -t x1 | tr -d ' ')" = "c61fbc03" ]

step "Package"
# The Release output as an MSIX, self-signed for the run: the layout without
# the build's own files, the manifest from the app config, the tiles from the
# icon, makeappx and signtool from the SDK. Installing it takes a trusted
# certificate, so CI only asserts the package.
node node_modules/expo-windows/cli/index.js package --no-build --self-signed
ls -la windows/AppPackages/*/*.msix windows/AppPackages/*/*.cer

step "The Windows App Runtime"
# An unpackaged app bootstraps against the Windows App Runtime, which a
# clean machine has not got: the MSIX packages come with the Windows App
# SDK the build just restored, in the order its own installer uses. (A
# packaged app declares the runtime as a dependency in its manifest and
# Windows brings it in at install, so this is the unpackaged road only.)
RUNTIME_MSIX=""
for store in "${NUGET_PACKAGES:-}" "$HOME/.nuget/packages" "$(cygpath -u "${USERPROFILE:-$HOME}")/.nuget/packages"; do
  [ -n "$store" ] || continue
  candidate="$(ls -d "$store"/microsoft.windowsappsdk.runtime/*/tools/MSIX/win10-x64 2>/dev/null | sort | tail -1)"
  [ -n "$candidate" ] && { RUNTIME_MSIX="$candidate"; break; }
done
if [ -n "$RUNTIME_MSIX" ]; then
  echo "runtime packages: $RUNTIME_MSIX"
  for package in Microsoft.WindowsAppRuntime.1.8 Microsoft.WindowsAppRuntime.Main.1.8 Microsoft.WindowsAppRuntime.Singleton.1.8 Microsoft.WindowsAppRuntime.DDLM.1.8; do
    file="$RUNTIME_MSIX/$package.msix"
    [ -f "$file" ] || continue
    # Already installed (a developer's machine) is not a failure.
    powershell -NoProfile -Command "try { Add-AppxPackage -Path '$(cygpath -w "$file")' -ErrorAction Stop; 'installed $package' } catch { 'skipped $package: ' + \$_.Exception.Message }"
  done
  powershell -NoProfile -Command "(Get-AppxPackage -Name 'Microsoft.WindowsAppRuntime.1.8' | Select-Object -First 1).PackageFullName"
else
  echo "no Windows App SDK runtime packages in the NuGet store; the app may find no runtime to bootstrap"
fi

step "Smoke"
# The Release exe, launched with EXPO_WINDOWS_SMOKE naming a file: the app
# writes whether its bundle loaded there and exits (init patched the entry
# for it); the job waits for the file and fails unless it says loaded.
rm -f smoke.txt smoke.log
EXPO_WINDOWS_SMOKE="$(cygpath -w "$PWD/smoke.txt")" "windows/x64/Release/$NAME.exe" > smoke.log 2>&1 &
smoke_pid=$!
for i in $(seq 1 60); do
  [ -f smoke.txt ] && break
  kill -0 "$smoke_pid" 2>/dev/null || break
  sleep 2
done
if [ ! -f smoke.txt ]; then
  # Say what became of the app rather than that its marker is missing.
  echo "the app left no marker: it never reported its bundle loaded"
  if kill -0 "$smoke_pid" 2>/dev/null; then
    echo "it is still running after 120 s; stopping it"
    kill "$smoke_pid" 2>/dev/null || true
  else
    wait "$smoke_pid" && echo "it exited with code 0" || echo "it exited with code $?"
  fi
  [ -s smoke.log ] && { echo "-- its output"; cat smoke.log; }
  echo "-- what Windows logged about it"
  powershell -NoProfile -Command "Get-WinEvent -LogName Application -MaxEvents 40 -ErrorAction SilentlyContinue | Where-Object { \$_.Message -like '*$NAME*' -or \$_.Message -like '*WindowsAppRuntime*' } | Select-Object -First 3 | Format-List TimeCreated, ProviderName, Message" || true
  exit 1
fi
cat smoke.txt; echo
# The marker carries the numbers a regression has to beat: the milliseconds
# from the process start to the bundle's load, and the working set then, in
# kilobytes. The budgets are generous for a shared runner; tighten them per
# app with SMOKE_MAX_MS and SMOKE_MAX_KB.
# (`read` answers 1 at an end of file without a newline, which the marker has none of.)
read -r smoke_status smoke_ms smoke_kb < smoke.txt || true
[ "$smoke_status" = loaded ]
echo "cold start ${smoke_ms:-?} ms · working set ${smoke_kb:-?} KB (budgets ${SMOKE_MAX_MS:-30000} ms, ${SMOKE_MAX_KB:-1048576} KB)"
[ "${smoke_ms:-0}" -le "${SMOKE_MAX_MS:-30000}" ]
[ "${smoke_kb:-0}" -le "${SMOKE_MAX_KB:-1048576}" ]

step "Built"
