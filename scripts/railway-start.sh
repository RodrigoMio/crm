#!/usr/bin/env sh
# Start na Railway com diagnóstico mínimo (Deploy Logs costuma ficar vazio se o processo morre cedo).
set -e
echo "[railway-start] $(date -u +%Y-%m-%dT%H:%M:%SZ) pwd=$(pwd)"
echo "[railway-start] PORT=${PORT:-<vazio>} HOST=${HOST:-<vazio>} NODE_ENV=${NODE_ENV:-<vazio>}"
if [ ! -f backend/dist/main.js ]; then
  echo "[railway-start] ERRO: backend/dist/main.js não existe. O build gerou o dist?"
  ls -la backend 2>/dev/null || echo "(sem pasta backend)"
  ls -la backend/dist 2>/dev/null || echo "(sem backend/dist)"
  exit 1
fi
exec node backend/dist/main.js
