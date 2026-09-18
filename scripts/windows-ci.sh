#!/usr/bin/env bash
# Builds the example on Windows end to end on the line react-native-windows
# ships: the example's source in a scratch Expo 57 app from scripts/windows-ci
# (React Native pinned to the react-native-windows release), this checkout's
# kit and runtime in its node_modules, `expo-windows init` writing and
# patching the Windows project the way `ios/` and `android/` are generated,
# autolinking, the Windows JavaScript bundle, and MSBuild with the v143
# toolset. What the harness in the guide does by hand, for CI.
#
#   scripts/windows-ci.sh <workdir>
#
# Needs Node, npm, MSBuild (from a Visual Studio with the C++ desktop
# workload and the Windows 11 SDK; `msbuild` on the PATH or Visual Studio
# 2022 in its default place), and the PowerShell 7 and .NET SDK the
# react-native-windows CLI loads its commands through.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${1:?workdir}"
APP="$WORK/WinCi"
CLI_VERSION="${CLI_VERSION:-20.1.0}"

step() { printf '\n==== %s\n' "$1"; }

step "The scratch app: the example's source on the pinned line"
rm -rf "$APP"
mkdir -p "$APP"
cp -r "$REPO/scripts/windows-ci/." "$APP/"
cp -r "$REPO/example/src" "$APP/src"
cp -r "$REPO/example/assets" "$APP/assets"
cp "$REPO/example/app.json" "$APP/app.json"
# Routes the example does not have: every SDK 57 package imported and asked
# what it can do, the web view with a page and a DOM component, the media
# packages, @expo/ui's platform subpaths, the community packages with
# Windows ports of their own, and the device packages.
cp -r "$REPO/scripts/windows-ci/probe/." "$APP/src/"
rm -rf "$APP/probe"
cp "$REPO/example/tsconfig.json" "$APP/tsconfig.json"
cd "$APP"
# The example's path aliases, without its link to the kit's source: the kit is a package here.
# (Relative paths: Node on Windows reads a Git Bash path against the current drive.)
node -e "
const fs = require('fs');
const t = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
delete t.compilerOptions.paths['expo-interface'];
fs.writeFileSync('./tsconfig.json', JSON.stringify(t, null, 2) + '\n');
"
cat tsconfig.json

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

step "This checkout's kit and runtime"
for pkg in expo-interface expo-windows; do
  src="$REPO"
  [ "$pkg" = expo-windows ] && src="$REPO/expo-windows"
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
done
# Listed as dependencies after the install, since neither is on npm at this
# version: react-native-windows' autolinking reads the manifest to find them.
KIT="$(node -p "require('./node_modules/expo-interface/package.json').version")"
RUNTIME="$(node -p "require('./node_modules/expo-windows/package.json').version")"
npm pkg set "dependencies.expo-interface=$KIT" "dependencies.expo-windows=$RUNTIME"
echo "kit $KIT, runtime $RUNTIME"
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
grep -q "ExpoInterface" "windows/$NAME/AutolinkedNativeModules.g.cpp"
grep -q "ExpoWindows" "windows/$NAME/AutolinkedNativeModules.g.cpp"
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
