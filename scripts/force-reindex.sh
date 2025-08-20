#!/bin/bash

# Force Ponder to re-index from scratch
# This script can be run on Railway to reset the database

echo "🔄 Starting Ponder re-indexing process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set. This script should be run on Railway."
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL=$DATABASE_URL

echo "📊 Connecting to database..."

# Option 1: Drop all Ponder tables (full reset)
psql $DB_URL << EOF
-- Drop all indexed data tables
DROP TABLE IF EXISTS "CollectionStat" CASCADE;
DROP TABLE IF EXISTS "Holder" CASCADE;
DROP TABLE IF EXISTS "UserBalance" CASCADE;
DROP TABLE IF EXISTS "NFT" CASCADE;
DROP TABLE IF EXISTS "Mint" CASCADE;

-- Drop Ponder's internal state tables
DROP TABLE IF EXISTS "_ponder_meta" CASCADE;
DROP TABLE IF EXISTS "_ponder_reorg" CASCADE;
DROP TABLE IF EXISTS "ponder_cache" CASCADE;
DROP TABLE IF EXISTS "ponder_sync_state" CASCADE;

-- List remaining tables to verify cleanup
\dt
EOF

if [ $? -eq 0 ]; then
  echo "✅ Database tables dropped successfully"
else
  echo "❌ Failed to drop database tables"
  exit 1
fi

# Clear local Ponder cache
echo "🧹 Clearing Ponder cache..."
rm -rf .ponder .ponder-cache node_modules/.ponder

echo "🚀 Starting Ponder with fresh index..."
echo "Ponder will now re-index from the configured start blocks."

# Start Ponder (it will recreate tables and re-index)
exec pnpm start