#!/usr/bin/env bash
# Local dev setup WITHOUT Docker — uses Homebrew PostgreSQL on macOS
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Checking PostgreSQL…"
if ! command -v psql >/dev/null; then
  echo "PostgreSQL not found. Install with:"
  echo "  brew install postgresql@16"
  echo "  brew services start postgresql@16"
  exit 1
fi

if ! pg_isready -q 2>/dev/null; then
  echo "PostgreSQL is not running. Start it with:"
  echo "  brew services start postgresql@16"
  exit 1
fi

echo "→ Creating bloomdidi role & database (if missing)…"
psql postgres -v ON_ERROR_STOP=0 <<'SQL'
DO $$ BEGIN
  CREATE USER bloomdidi WITH PASSWORD 'bloomdidi_dev_password' CREATEDB;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
SQL

psql postgres -v ON_ERROR_STOP=0 -c "CREATE DATABASE bloomdidi OWNER bloomdidi;" 2>/dev/null || true
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE bloomdidi TO bloomdidi;"

echo "→ Enabling PostGIS (optional — geo discovery falls back to Haversine if missing)…"
if command -v brew >/dev/null && brew list postgis >/dev/null 2>&1; then
  psql bloomdidi -v ON_ERROR_STOP=0 -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || \
    psql -U bloomdidi -d bloomdidi -v ON_ERROR_STOP=0 -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || \
    echo "  (skipped — run manually: brew install postgis && psql bloomdidi -c 'CREATE EXTENSION postgis;')"
else
  echo "  PostGIS not installed. For faster geo queries: brew install postgis"
fi

echo "→ Installing dependencies…"
npm install
npm run build -w @bloomdidi/shared

echo "→ Configuring API env…"
if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
fi

echo "→ Running migrations…"
npm run db:migrate

echo "→ Seeding demo data…"
npm run db:seed

echo ""
echo "✓ Setup complete (no Docker required)."
echo ""
echo "Start the apps in separate terminals:"
echo "  npm run dev:api"
echo "  npm run dev:customer"
echo "  npm run dev:vendor"
echo ""
echo "Demo logins — OTP: 123456"
echo "  Customer: +919123456789"
echo "  Vendor:   +919876543210"
