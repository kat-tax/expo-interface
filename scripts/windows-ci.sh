#!/usr/bin/env bash
# Builds the example on Windows end to end, on the line react-native-windows
# ships. The road is the runtime's (`expo-windows/ci/build.sh`: a scratch app
# with React Native pinned to that line, `expo-windows init`, autolinking, the
# bundle, Debug and Release builds, the package and a smoke launch). This says
# what the kit builds over it: the example's source, this checkout's kit in its
# node_modules, the kit's native library among what autolinking registers, and
# one more route, which draws `@expo/ui` and the community controls through
# the aliases the kit contributes.
#
#   scripts/windows-ci.sh <workdir>
#   STOP_AFTER=bundle scripts/windows-ci.sh <workdir>
#
# `EXPO_WINDOWS_DIR` names a checkout of the runtime other than the one beside
# this script. Everything the runtime's script reads from the environment
# passes through: RN_VERSION, RNW_VERSION, CLI_VERSION, WINDOWS_SDK, TOOLSET,
# SMOKE_MAX_MS, SMOKE_MAX_KB.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="${EXPO_WINDOWS_DIR:-$REPO/expo-windows}"
[ -f "$RUNTIME/ci/build.sh" ] || { echo "no expo-windows checkout at $RUNTIME: set EXPO_WINDOWS_DIR to one"; exit 1; }

# What the example depends on that the runtime's scratch app has no use for,
# at the example's own ranges so the two cannot drift apart.
cd "$REPO"
EXTRA="$(node -p "['@expo/ui', '@expo/material-symbols', 'nanoid', 'qrcode-generator'].map(name => name + '@' + require('./example/package.json').dependencies[name]).join(' ')")"
echo "the example's own dependencies: $EXTRA"
case "$EXTRA" in *undefined*) echo "the example no longer depends on one of them: see this script"; exit 1;; esac

APP_SOURCE="$REPO/example" \
EXTRA_SOURCE="$REPO/scripts/windows-ci/probe" \
EXTRA_DEPENDENCIES="$EXTRA" \
OVERLAY="expo-interface=$REPO" \
EXPECT_LINKED="ExpoInterface" \
  exec bash "$RUNTIME/ci/build.sh" "$@"
