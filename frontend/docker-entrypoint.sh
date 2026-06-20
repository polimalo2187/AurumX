#!/bin/sh
set -eu

mkdir -p /app/dist

cat > /app/dist/env.js <<ENVJS
window.__AURUMX_ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-}",
  VITE_APP_NAME: "${VITE_APP_NAME:-AurumX}",
  VITE_TELEGRAM_BOT_USERNAME: "${VITE_TELEGRAM_BOT_USERNAME:-}"
};
ENVJS

exec pnpm exec vite preview --host 0.0.0.0 --port "${PORT:-8080}"
