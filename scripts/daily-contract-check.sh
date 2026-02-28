#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3018}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

APP_PASSWORD_VALUE="${APP_PASSWORD:-}"
if [[ -z "$APP_PASSWORD_VALUE" ]]; then
  echo "APP_PASSWORD is required (load from .env or env var)." >&2
  exit 1
fi

call() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X "$method" "$BASE_URL$path" -H 'Content-Type: application/json' -d "$body"
  else
    curl -sS -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X "$method" "$BASE_URL$path"
  fi
}

echo "[0/6] login"
call POST /api/auth/login "{\"password\":\"$APP_PASSWORD_VALUE\"}" >/dev/null

echo "[1/6] start daily"
call POST /api/daily/start >/dev/null

echo "[2/6] quiz progress -> roundsCompleted=10"
call POST /api/daily/progress '{"block":"quiz","event":"progress","payload":{"roundsCompleted":10}}' >/dev/null

echo "[3/6] recap progress -> attempt_completed"
call POST /api/daily/progress '{"block":"recap","event":"attempt_completed"}' >/dev/null

echo "[4/6] interview progress -> acceptable=true"
call POST /api/daily/progress '{"block":"interview","event":"attempt_completed","payload":{"acceptable":true}}' >/dev/null

echo "[5/7] fluency progress -> promptsCompleted=10"
call POST /api/daily/progress '{"block":"fluency","event":"progress","payload":{"promptsCompleted":10}}' >/dev/null

echo "[6/7] fluency C progress -> itemsCompleted=5"
call POST /api/daily/progress '{"block":"fluency_c","event":"progress","payload":{"itemsCompleted":5}}' >/dev/null

echo "[7/7] verify completed"
JSON="$(call GET /api/daily/today)"

python3 - <<'PY' "$JSON"
import json,sys
obj=json.loads(sys.argv[1])
lesson=obj["lesson"]
progress=lesson["progressJson"]
assert lesson["status"]=="completed", f"status={lesson['status']}"
assert progress["completed"] is True
for b in ["quiz","recap","interview","fluency","fluency_c"]:
    assert progress["blocks"][b]["done"] is True, f"{b} not done"
print("OK: daily contract checks passed")
PY
