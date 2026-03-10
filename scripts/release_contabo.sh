#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REMOTE_HOST="${REMOTE_HOST:-contabo}"
REMOTE_PATH="${REMOTE_PATH:-/opt/852}"
PUBLIC_URL="${PUBLIC_URL:-https://852.egos.ia.br}"
LOCAL_BASE_URL="${LOCAL_BASE_URL:-http://127.0.0.1:3100}"
LOCAL_PORT="${LOCAL_PORT:-3100}"

cd "$PROJECT_ROOT"

cleanup() {
  if [[ -n "${LOCAL_SERVER_PID:-}" ]] && kill -0 "$LOCAL_SERVER_PID" 2>/dev/null; then
    kill "$LOCAL_SERVER_PID" 2>/dev/null || true
    wait "$LOCAL_SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "==> Governance check"
if [[ -x "$HOME/.egos/bin/egos-gov" ]]; then
  export PATH="$HOME/.egos/bin:$PATH"
  egos-gov check
else
  echo "WARN: egos-gov not found at $HOME/.egos/bin/egos-gov"
fi

echo "==> Local lint"
npm run lint

echo "==> Local build"
npm run build

echo "==> Start local production server"
PORT="$LOCAL_PORT" npm run start > /tmp/852-release-local.log 2>&1 &
LOCAL_SERVER_PID=$!

for _ in {1..30}; do
  if curl -s -o /dev/null "$LOCAL_BASE_URL/"; then
    break
  fi
  sleep 1
done

if ! curl -s -o /dev/null "$LOCAL_BASE_URL/"; then
  echo "Local production server did not become ready. See /tmp/852-release-local.log" >&2
  exit 1
fi

echo "==> Local smoke"
BASE_URL="$LOCAL_BASE_URL" bash "$SCRIPT_DIR/smoke_852.sh" local

echo "==> Local rate limit verification"
python3 "$SCRIPT_DIR/verify_rate_limit.py" "$LOCAL_BASE_URL"

echo "==> Sync to VPS"
rsync -avz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.git' \
  --exclude='.egos' \
  --exclude='.agent' \
  --exclude='.windsurf' \
  --exclude='.guarani/orchestration' \
  --exclude='.guarani/philosophy' \
  --exclude='.guarani/prompts' \
  --exclude='.guarani/refinery' \
  "$PROJECT_ROOT/" "$REMOTE_HOST:$REMOTE_PATH/"

echo "==> Remote build and restart"
ssh "$REMOTE_HOST" "cd '$REMOTE_PATH' && docker compose build --no-cache && docker compose up -d --force-recreate"

echo "==> Remote health"
ssh "$REMOTE_HOST" "sleep 6; docker ps --filter name=852-app --format '{{.Status}}'; curl -s -o /dev/null -w 'landing:%{http_code} ' http://127.0.0.1:3001/; curl -s -o /dev/null -w 'chat:%{http_code} ' http://127.0.0.1:3001/chat; curl -s -o /dev/null -w 'api:%{http_code}\n' -X POST http://127.0.0.1:3001/api/chat -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"oi\"}]}'"

echo "==> Public smoke"
BASE_URL="$PUBLIC_URL" bash "$SCRIPT_DIR/smoke_852.sh" public

echo "Release OK: $PUBLIC_URL"
