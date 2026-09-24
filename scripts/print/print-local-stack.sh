#!/usr/bin/env bash
# Local print stack for local printing related tests.
#   web-portal (production build) -> service-print-api -> service-print-renderer -> PDF
# moto (one docker container) fakes DynamoDB, SQS and S3. The state service stays the deployed dev one.
#
# Usage: print-local-stack.sh up | down | status | rebuild-portal | help
# Env:   PORTAL_PORT (3000)  API_PORT (8000)  REPOS (parent of web-portal)  KEEP_MOTO=1 (down keeps the container)
set -euo pipefail

PORTAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPOS="${REPOS:-$(dirname "$PORTAL_DIR")}"
API_DIR="$REPOS/service-print-api"
RENDERER_DIR="$REPOS/service-print-renderer"
PORTAL_PORT="${PORTAL_PORT:-3000}"
API_PORT="${API_PORT:-8000}"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/print-local-stack"
PORTAL_ENTRY="$PORTAL_DIR/packages/main/.output/server/index.mjs"
mkdir -p "$STATE_DIR"

log() { printf '\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

port_busy() { ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1$"; }
alive() { [ -f "$STATE_DIR/$1.pid" ] && kill -0 "$(cat "$STATE_DIR/$1.pid")" 2>/dev/null; }

# Start "$3..." in dir "$2" as its own process group; pid in $STATE_DIR/$1.pid, log in $1.log
start_bg() {
  local name="$1" dir="$2"; shift 2
  if alive "$name"; then echo "$name already running (pid $(cat "$STATE_DIR/$name.pid"))"; return; fi
  setsid bash -c 'echo $$ > "$1"; cd "$2"; shift 2; exec "$@"' _ "$STATE_DIR/$name.pid" "$dir" "$@" \
    > "$STATE_DIR/$name.log" 2>&1 &
  sleep 1; echo "$name started (log: $STATE_DIR/$name.log)"
}
# Stop only what this script started (whole process group, e.g. the reloader of fastapi dev)
stop_bg() {
  if alive "$1"; then kill -- "-$(cat "$STATE_DIR/$1.pid")" 2>/dev/null || true; echo "$1 stopped"; else echo "$1 not running"; fi
  rm -f "$STATE_DIR/$1.pid"
}
# Set KEY=VALUE in an env file, replacing any existing line
set_env() { { grep -v "^$2=" "$1" || true; echo "$2=$3"; } > "$1.tmp" && mv "$1.tmp" "$1"; }
wait_for() { # name url seconds
  for _ in $(seq "$3"); do curl -fs -o /dev/null "$2" && { echo "$1 ready: $2"; return; }; sleep 1; done
  die "$1 not ready after $3 s, see $STATE_DIR/*.log"
}

prereqs() {
  for c in docker uv git curl node ss; do command -v "$c" >/dev/null || die "missing: $c"; done
  docker compose version >/dev/null 2>&1 || die "docker compose plugin missing"
  [ -x /usr/bin/google-chrome ] || die "the renderer needs Google Chrome at /usr/bin/google-chrome"
  # corepack honours the packageManager field of web-portal; a standalone pnpm may try to self-switch versions
  if command -v corepack >/dev/null; then PNPM=(corepack pnpm); else PNPM=(pnpm); fi
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
  local p name
  for p in "$API_PORT:api" "$PORTAL_PORT:portal"; do
    name="${p#*:}"
    alive "$name" || ! port_busy "${p%:*}" || die "port ${p%:*} is busy (not started by this script). Free it or set ${name^^}_PORT"
  done
}

build_portal() {
  log "Building the portal (production, a few minutes)"
  # nuxt.config.ts starts the OTEL exporter at load time, which needs a valid URL even when unused
  (cd "$PORTAL_DIR" && export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
    && "${PNPM[@]}" run build-libs && "${PNPM[@]}" --filter main run build)
}

up() {
  prereqs
  log "Repos"
  for r in "$API_DIR" "$RENDERER_DIR"; do
    if [ -d "$r/.git" ]; then echo "$(basename "$r") already present"; else git clone --depth 1 "https://github.com/swissgeo/$(basename "$r")" "$r"; fi
    [ -f "$r/.env" ] || cp "$r/.env.default" "$r/.env"
  done
  set_env "$API_DIR/.env" HTTP_PORT "$API_PORT"
  set_env "$RENDERER_DIR/.env" PORTAL_URL "http://localhost:$PORTAL_PORT/?"
  set_env "$RENDERER_DIR/.env" OTEL_SDK_DISABLED true

  log "moto (DynamoDB, SQS, S3 on :5000) and the print API on :$API_PORT"
  mkdir -p "$API_DIR/logs"
  (cd "$API_DIR" && uv sync --quiet && make start-moto)
  start_bg api "$API_DIR" env UV_ENV_FILE=.env uv run fastapi dev --port "$API_PORT"

  log "Renderer worker"
  (cd "$RENDERER_DIR" && uv sync --quiet)
  start_bg renderer "$RENDERER_DIR" env ENV_FILE=.env UV_ENV_FILE=.env uv run python -m app.worker

  log "Portal on :$PORTAL_PORT"
  [ -f "$PORTAL_ENTRY" ] || build_portal
  # demo settings go in the environment: the .env of web-portal is not touched
  start_bg portal "$PORTAL_DIR/packages/main" env NITRO_PORT="$PORTAL_PORT" \
    NUXT_PUBLIC_OGC_API_ENDPOINT=https://services.dev.sgdi.tech/api/oar/rc1 \
    NUXT_PUBLIC_OGC_CATALOG_COLLECTION=swissgeo-catalog \
    NUXT_PUBLIC_PRINT_SERVICE_URL="http://localhost:$API_PORT/api/wps/v1/print/jobs" \
    node .output/server/index.mjs

  log "Waiting for the services"
  wait_for api "http://localhost:$API_PORT/checker" 90
  wait_for portal "http://localhost:$PORTAL_PORT/en/map" 60
  alive renderer || die "renderer stopped, see $STATE_DIR/renderer.log"
  cat <<EOF

Ready. Portal:  http://localhost:$PORTAL_PORT/en/map   (debug bar at the bottom -> "Open Print Panel")
       API docs: http://localhost:$API_PORT/api/wps/v1/print/docs
Send a print request, watch open -> started -> finished in the job list, open the pdf link.
Same payload twice returns the old job (24 h cache): change scale or format to render again.
Stop with: $0 down
EOF
}

down() {
  for n in portal renderer api; do stop_bg "$n"; done
  [ "${KEEP_MOTO:-0}" = 1 ] || { (cd "$API_DIR" && make stop-moto) 2>/dev/null || true; }
}

status() {
  for n in api renderer portal; do alive "$n" && echo "$n: running (pid $(cat "$STATE_DIR/$n.pid"))" || echo "$n: stopped"; done
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx moto-server && echo "moto: running" || echo "moto: stopped"
  echo "logs: $STATE_DIR"
}

case "${1:-help}" in
  up) up ;;
  down) down ;;
  status) status ;;
  rebuild-portal) prereqs; stop_bg portal; build_portal; echo "Rebuilt. Run: $0 up" ;;
  *) sed -n '2,7p' "$0" ;;
esac
