#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> CoSora setup"

start_services() {
  if command -v docker &>/dev/null; then
    echo "==> Starting Postgres + Redis via Docker..."
    docker compose up -d
    sleep 5
    return
  fi

  if command -v brew &>/dev/null; then
    echo "==> Docker not found — using Homebrew services..."
    brew list postgresql@15 &>/dev/null || brew install postgresql@15
    brew list redis &>/dev/null || brew install redis
    brew services start postgresql@15
    brew services start redis
    sleep 3

    export PATH="/opt/homebrew/opt/postgresql@15/bin:/usr/local/opt/postgresql@15/bin:$PATH"
    if command -v psql &>/dev/null; then
      psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='cosora'" 2>/dev/null | grep -q 1 \
        || psql postgres -c "CREATE USER cosora WITH PASSWORD 'cosora' CREATEDB;" 2>/dev/null || true
      psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='cosora'" 2>/dev/null | grep -q 1 \
        || psql postgres -c "CREATE DATABASE cosora OWNER cosora;" 2>/dev/null || true
    fi
    return
  fi

  echo "WARN: Install PostgreSQL 15 + Redis manually, or install Docker/Homebrew."
}

start_services

echo "==> Installing dependencies..."
npm run install:all

echo "==> Configuring env..."
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f frontend/.env.local ] || cp frontend/.env.example frontend/.env.local

echo "==> Database setup..."
cd backend
npm run db:generate
npm run db:push
npm run db:seed

export PATH="/opt/homebrew/opt/postgresql@15/bin:/usr/local/opt/postgresql@15/bin:$PATH"
if command -v psql &>/dev/null; then
  echo "==> Applying audit triggers..."
  psql "${DATABASE_URL:-postgresql://cosora:cosora@localhost:5432/cosora}" \
    -f src/prisma/migrations/audit_triggers.sql || true
fi

cd "$ROOT"
echo ""
echo "Setup complete!"
echo "  npm run dev          # start backend + frontend"
echo "  Password: CoSora2024!"
echo "  Admin User ID: check seed output above (General Counsel)"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:4000"
