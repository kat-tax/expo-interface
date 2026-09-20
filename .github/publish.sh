#!/usr/bin/env bash
# Publishes the package in a directory.
#
#     bash .github/publish.sh .
#
# Two things it refuses to do, each because the alternative is worse than a
# skipped step:
#
# A version already on the registry is left alone, so re-running a release is
# not a failure.
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
# At npm's usual log level a trusted publisher it could not use is silence: the
# exchange fails, npm falls back to wanting a login, and the error is ENEEDAUTH
# with no word of why. The reason is logged two levels down, so the publish is
# run there, shown as it would have been, and asked for the reason if it fails.
log="$(mktemp)"
status=0
npm publish --provenance --access public --loglevel silly > "$log" 2>&1 || status=$?
grep -v -E '^npm (verbose|silly|http|info|timing) ' "$log" || true
if [ "$status" -ne 0 ]; then
  echo
  echo "What npm said about publishing as a trusted publisher:"
  grep -E '^npm (verbose|silly) oidc' "$log" | sed 's/^/    /' ||
    echo "    nothing, so it never tried: is id-token: write granted, and npm at 11.5 or later?"
  echo
  echo "npm matches a trusted publisher on four things, exactly, in the case they"
  echo "have on GitHub: the organisation or user, the repository, the workflow's"
  echo "file name, and the environment, which must be blank when the job names"
  echo "none. It checks none of them when they are saved. This run was:"
  echo
  echo "    repository   ${GITHUB_REPOSITORY:-not on GitHub Actions}"
  echo "    workflow     ${GITHUB_WORKFLOW_REF:-not on GitHub Actions}"
  exit "$status"
fi
