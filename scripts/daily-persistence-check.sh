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
  echo "APP_PASSWORD is required" >&2
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

echo "[1/8] login"
call POST /api/auth/login "{\"password\":\"$APP_PASSWORD_VALUE\"}" >/dev/null

echo "[2/8] start and complete daily"
call POST /api/daily/start >/dev/null
call POST /api/daily/progress '{"block":"quiz","event":"done"}' >/dev/null
call POST /api/daily/progress '{"block":"recap","event":"done"}' >/dev/null
call POST /api/daily/progress '{"block":"interview","event":"done"}' >/dev/null
call POST /api/daily/progress '{"block":"fluency","event":"done"}' >/dev/null
call POST /api/daily/progress '{"block":"fluency_c","event":"done"}' >/dev/null

echo "[3/8] read daily"
J1="$(call GET /api/daily/today)"

python3 - <<'PY' "$J1"
import json,sys
j=json.loads(sys.argv[1])
lesson=j['lesson']
assert lesson['status']=='completed', lesson['status']
assert lesson['progressJson']['completed'] is True
print('checkpoint1 ok')
PY

echo "[4/8] logout"
call POST /api/auth/logout >/dev/null

echo "[5/8] login again"
call POST /api/auth/login "{\"password\":\"$APP_PASSWORD_VALUE\"}" >/dev/null

echo "[6/8] read daily again"
J2="$(call GET /api/daily/today)"

python3 - <<'PY' "$J2"
import json,sys
j=json.loads(sys.argv[1])
lesson=j['lesson']
assert lesson['status']=='completed', lesson['status']
assert lesson['progressJson']['completed'] is True
print('checkpoint2 ok')
PY

echo "[7/8] done"
echo "OK: daily persistence survives refresh/relogin"
