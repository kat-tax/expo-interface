#!/usr/bin/env bash
# Builds the Windows platform end to end on the line react-native-windows
# ships: a scratch Expo 57 app from scripts/windows-ci (React Native pinned
# to the react-native-windows release), this checkout's kit and runtime in
# its node_modules, `expo-windows init` writing and patching the project,
# autolinking, MSBuild with the v143 toolset, and the Windows JavaScript
# bundle. What the harness in the guide does by hand, for CI.
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

step "The scratch app"
rm -rf "$APP"
mkdir -p "$APP"
cp -r "$REPO/scripts/windows-ci/." "$APP/"
cd "$APP"

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

step "expo-windows init"
node node_modules/expo-windows/cli/index.js init --cli-version "$CLI_VERSION"

step "Autolink"
node node_modules/@react-native-community/cli/build/bin.js autolink-windows --sln windows/WinCi.sln --proj windows/WinCi/WinCi.vcxproj --logging
grep -q "ExpoInterface" windows/WinCi/AutolinkedNativeModules.g.cpp
grep -q "ExpoWindows" windows/WinCi/AutolinkedNativeModules.g.cpp

step "The Windows JavaScript bundle"
node node_modules/expo-windows/cli/index.js bundle
ls -la windows/WinCi/Bundle/index.windows.bundle

step "MSBuild"
if command -v msbuild >/dev/null 2>&1; then
  MSBUILD=msbuild
else
  MSBUILD="/c/Program Files/Microsoft Visual Studio/2022/Community/MSBuild/Current/Bin/MSBuild.exe"
fi
"$MSBUILD" windows/WinCi.sln -t:WinCi -restore -m -v:m -nologo \
  -p:Configuration=Debug -p:Platform=x64 -p:PlatformToolset="${TOOLSET:-v143}" \
  -p:RunAutolinkCheck=false -p:RestorePackagesConfig=true
ls -la windows/x64/Debug/WinCi.exe

step "Built"
