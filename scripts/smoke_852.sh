#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-public}"

case "$MODE" in
  local)
    BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
    ;;
  vps)
    BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
    ;;
  public)
    BASE_URL="${BASE_URL:-https://852.egos.ia.br}"
    ;;
  *)
    echo "Usage: bash scripts/smoke_852.sh [local|vps|public]" >&2
    exit 1
    ;;
esac

echo "Smoke target: $BASE_URL"

landing_status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/")
chat_status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/chat")
api_status=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"oi"}]}')
invalid_status=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[]}')

echo "landing:$landing_status chat:$chat_status api:$api_status invalid:$invalid_status"

if [[ "$landing_status" != "200" || "$chat_status" != "200" || "$api_status" != "200" || "$invalid_status" != "400" ]]; then
  echo "Smoke test failed for $BASE_URL" >&2
  exit 1
fi

echo "Smoke test OK for $BASE_URL"
