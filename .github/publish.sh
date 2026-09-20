#!/usr/bin/env bash
# Publishes one of the repository's packages, given its directory.
#
#     bash .github/publish.sh .              the kit
#     bash .github/publish.sh expo-windows   the runtime
#
# Two things it refuses to do, each because the alternative is worse than a
# skipped step:
#
# A version already on the registry is left alone, so re-running a release, or
# tagging when only one of the two packages moved, is not a failure.
#
# A package the registry has never seen is skipped with the reason. Publishing
# here is npm trusted publishing (OIDC), and npm cannot do a package's *first*
# publish that way: a trusted publisher is configured on the package's page,
# which does not exist until the package does. The first version goes up by
# hand, once, and this script takes over from the second.
set -euo pipefail

dir="${1:?a package directory}"
cd "$dir"
name="$(node -p "require('./package.json').name")"
version="$(node -p "require('./package.json').version")"

if npm view "$name@$version" version > /dev/null 2>&1; then
  echo "$name@$version is already on the registry; nothing to publish."
  exit 0
fi

if ! npm view "$name" version > /dev/null 2>&1; then
  echo "$name is not on the registry at all, so this cannot be its first publish."
  echo
  echo "npm configures a trusted publisher on a package's own page, so the"
  echo "package has to exist before OIDC can publish it. Publish $version once"
  echo "by hand:"
  echo
  echo "    npm login"
  [ "$dir" = "." ] || echo "    cd $dir"
  echo "    npm publish --access public"
  echo
  echo "then add this repository and the Release workflow as the package's"
  echo "trusted publisher on npmjs.com. Every release after that runs here."
  exit 0
fi

echo "Publishing $name@$version"
npm publish --provenance --access public
