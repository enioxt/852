#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_BASE_URL="${LOCAL_BASE_URL:-http://127.0.0.1:3100}"
LOCAL_PORT="${LOCAL_PORT:-3100}"
VERIFY_RATE_LIMIT="${VERIFY_RATE_LIMIT:-1}"

cleanup() {
  if [[ -n "${LOCAL_SERVER_PID:-}" ]] && kill -0 "$LOCAL_SERVER_PID" 2>/dev/null; then
    kill "$LOCAL_SERVER_PID" 2>/dev/null || true
    wait "$LOCAL_SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

PORT="$LOCAL_PORT" npm run start > /tmp/852-local-prod-check.log 2>&1 &
LOCAL_SERVER_PID=$!

for _ in {1..30}; do
  if curl -s -o /dev/null "$LOCAL_BASE_URL/"; then
    break
  fi
  sleep 1
done

if ! curl -s -o /dev/null "$LOCAL_BASE_URL/"; then
  echo "Local production server did not become ready. See /tmp/852-local-prod-check.log" >&2
  exit 1
fi

if [[ "$VERIFY_RATE_LIMIT" == "1" ]]; then
  BASE_URL="$LOCAL_BASE_URL" bash "$SCRIPT_DIR/smoke_852.sh" local
  python3 "$SCRIPT_DIR/verify_rate_limit.py" "$LOCAL_BASE_URL"
else
  BASE_URL="$LOCAL_BASE_URL" bash "$SCRIPT_DIR/smoke_852.sh" ci
fi
