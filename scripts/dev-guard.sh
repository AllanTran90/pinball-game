#!/bin/sh
# Runs the Vite dev server and stops it before it can take down the computer.
#
# It stops the server when either:
#   - the server (with its child processes) uses more than DEV_MEMORY_LIMIT_MB, or
#   - the whole computer's free memory drops below DEV_MIN_FREE_PERCENT.
#
#   npm run dev
#   DEV_MEMORY_LIMIT_MB=1500 DEV_MIN_FREE_PERCENT=60 npm run dev

LIMIT_MB=${DEV_MEMORY_LIMIT_MB:-2000}
MIN_FREE=${DEV_MIN_FREE_PERCENT:-50}
INTERVAL=0.5
PEAK_MB=0

cd "$(dirname "$0")/.." || exit 1

descendants() {
  for child in $(pgrep -P "$1"); do
    echo "$child"
    descendants "$child"
  done
}

tree_mb() {
  ps -o rss= -p "$(printf '%s,' "$1" $(descendants "$1") | sed 's/,$//')" 2>/dev/null |
    awk '{s += $1} END {print int(s / 1024)}'
}

# Same number as "System-wide memory free percentage" from memory_pressure.
free_percent() {
  sysctl -n kern.memorystatus_level
}

stop_server() {
  pids="$(descendants "$SERVER_PID") $SERVER_PID"
  kill -TERM $pids 2>/dev/null
  sleep 2
  kill -KILL $pids 2>/dev/null
}

stop_because() {
  echo ""
  echo "[dev-guard] ⚠️  $1 — stopping the dev server to protect your computer."
  stop_server
  exit 1
}

START_FREE=$(free_percent)
if [ "$START_FREE" -lt "$MIN_FREE" ]; then
  echo "[dev-guard] Only ${START_FREE}% memory free (need ${MIN_FREE}%). Close some apps and try again."
  exit 1
fi

./node_modules/.bin/vite "$@" &
SERVER_PID=$!
trap 'stop_server; echo "[dev-guard] stopped. peak server memory: ${PEAK_MB} MB"; exit 0' INT TERM
echo "[dev-guard] watching dev server (pid $SERVER_PID): max ${LIMIT_MB} MB, min ${MIN_FREE}% free"

while kill -0 "$SERVER_PID" 2>/dev/null; do
  MB=$(tree_mb "$SERVER_PID")
  FREE=$(free_percent)
  [ "${MB:-0}" -gt "$PEAK_MB" ] && PEAK_MB=$MB
  [ "${MB:-0}" -gt "$LIMIT_MB" ] && stop_because "dev server uses ${MB} MB (max ${LIMIT_MB} MB)"
  [ "${FREE:-100}" -lt "$MIN_FREE" ] && stop_because "only ${FREE}% memory free (min ${MIN_FREE}%)"
  sleep "$INTERVAL"
done

wait "$SERVER_PID"
