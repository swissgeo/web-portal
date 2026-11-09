#!/usr/bin/env bash
# Repo-wide checks run after each package switch in step 4.
# usage: slop/scripts/step_4/verify.sh <log dir>
# Prints one status line per check; full output goes to <log dir>/<check>.log.
set -u
cd "$(dirname "$0")/../../.." || exit 1
out="${1:?log dir}"
mkdir -p "$out"

strip() { sed 's/\x1b\[[0-9;]*m//g' "$1"; }

run() {
  local name="$1"
  shift
  "$@" >"$out/$name.log" 2>&1
  echo "$name=$?"
}

pnpm run format:write >/dev/null 2>&1
run build-libs pnpm run build-libs
# TS diagnostics from the remaining library builds, minus the known TS2883 ones
strip "$out/build-libs.log" | grep -oE "packages/[a-z/-]+ build: .*error TS[0-9]+.*" | grep -v TS2883 | cut -c1-200
run type-check pnpm run type-check
strip "$out/type-check.log" | grep "error TS" | cut -c1-220 | head -20
run lint pnpm run lint
strip "$out/lint.log" | grep -B1 " error " | head -20
run format pnpm run format
run test pnpm run test:unit
strip "$out/test.log" | grep -E "Tests |FAIL"
run main-build pnpm --filter main run build
strip "$out/main-build.log" | grep -iE "\b(error|failed)\b|could not resolve" | grep -vE "error-template|/error-[A-Za-z0-9_-]+\.js" | head -10
