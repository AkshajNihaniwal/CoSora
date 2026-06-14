#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "CoSora — starting local hosting…"

if command -v brew >/dev/null 2>&1; then
  brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
  brew services start redis 2>/dev/null || true
fi

if ! pg_isready -h localhost -q 2>/dev/null; then
  echo "ERROR: PostgreSQL is not running. Run: brew services start postgresql@15"
  exit 1
fi

if ! redis-cli ping >/dev/null 2>&1; then
  echo "ERROR: Redis is not running. Run: brew services start redis"
  exit 1
fi

if lsof -i :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Backend already running on http://localhost:4000"
else
  echo "Starting backend…"
fi

if lsof -i :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Frontend already running on http://localhost:3000"
  echo ""
  echo "Open: http://localhost:3000/login"
  exit 0
fi

echo ""
echo "Frontend: http://localhost:3000"
echo "API:      http://localhost:4000"
echo "Login:    http://localhost:3000/login"
echo "Password: CoSora2024!"
echo ""
npm run dev
