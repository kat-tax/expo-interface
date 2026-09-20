#!/usr/bin/env bash
# Lifts a workspace out of this repository as a repository of its own, with the
# history of its folder.
#
#   scripts/split/extract.sh expo-vitest  ../expo-vitest
#   scripts/split/extract.sh expo-windows ../expo-windows
#
# Local only: it makes a branch here (`split/<package>`), clones that to the
# destination and makes the clone stand alone. Nothing is pushed, published or
# created on GitHub. What comes after is in scripts/split/README.md.
#
# `EXPO_VITEST` is what the runtime depends on `expo-vitest` as: a version range
# once it is published (`^0.1.0`, the default), or a tarball's path to rehearse
# before it is.
set -euo pipefail

PACKAGE="${1:?a workspace: expo-vitest or expo-windows}"
DESTINATION="${2:?where the new repository goes}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
EXPO_VITEST="${EXPO_VITEST:-^0.1.0}"

[ -d "$REPO/$PACKAGE" ] || { echo "no workspace called $PACKAGE here"; exit 1; }
[ -e "$DESTINATION" ] && { echo "$DESTINATION is already there: move it aside first"; exit 1; }
cd "$REPO"
[ -z "$(git status --porcelain -- "$PACKAGE")" ] || { echo "$PACKAGE has changes that are not committed, and a split carries commits only"; exit 1; }

echo "==== The history of $PACKAGE/, as a branch"
git branch -D "split/$PACKAGE" > /dev/null 2>&1 || true
# It reports every commit it looks at; the last line is the one worth reading.
git subtree split --prefix="$PACKAGE" -b "split/$PACKAGE" 2>&1 | tail -1
git log --oneline "split/$PACKAGE" | tail -n +1 | wc -l | xargs echo "commits:"

echo "==== The new repository"
mkdir -p "$(dirname "$DESTINATION")"
git clone -q --branch "split/$PACKAGE" --single-branch "$REPO" "$DESTINATION"
cd "$DESTINATION"
git branch -m master
git remote remove origin

echo "==== Standing alone"
EXPO_VITEST="$EXPO_VITEST" node "$REPO/scripts/split/stand-alone.mjs" "$PACKAGE" .
git status --short

echo
echo "$PACKAGE is at $DESTINATION, with what makes it stand alone left uncommitted for a look."
echo "Next: bun install, then its gate. See scripts/split/README.md."
