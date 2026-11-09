#!/usr/bin/env bash
# Ball-park build profile: wall clock time and peak RAM (all processes together).
# usage: profile-build.sh [command...]   default: pnpm run build:dev
#
# Each time (keeping the local .env files):
#   git clean -ndx -e '.env*'   # dry run, check what would be deleted
#   git clean -fdx -e '.env*'   # removes node_modules, .nuxt, .output, dist, ...
#   pnpm install --frozen-lockfile
#   slop/scripts/profile-build.sh
set -u
[ $# -eq 0 ] && set -- pnpm run build:dev
log=$(mktemp --suffix=.log)

start=$SECONDS
setsid "$@" >"$log" 2>&1 & # own process group, so all child processes are counted
pid=$!
peak_kib=0
while kill -0 "$pid" 2>/dev/null; do
  kib=$(ps -o rss= -g "$pid" | awk '{ sum += $1 } END { print sum + 0 }')
  ((kib > peak_kib)) && peak_kib=$kib
  sleep 0.5
done
wait "$pid"
status=$?
elapsed=$((SECONDS - start))

printf '%s\n  time: %dm %02ds\n  peak RAM: %s GiB\n  exit code: %d (log: %s)\n' \
  "$*" $((elapsed / 60)) $((elapsed % 60)) \
  "$(awk -v k="$peak_kib" 'BEGIN { printf "%.1f", k / 1048576 }')" "$status" "$log"
