-- Reset Ponder database for full re-index
-- This will clear all indexed data and force Ponder to start from scratch

-- Drop all Ponder-specific tables
DROP TABLE IF EXISTS "CollectionStat" CASCADE;
DROP TABLE IF EXISTS "Holder" CASCADE;
DROP TABLE IF EXISTS "UserBalance" CASCADE;
DROP TABLE IF EXISTS "NFT" CASCADE;
DROP TABLE IF EXISTS "Mint" CASCADE;

-- Drop Ponder's internal tracking tables
DROP TABLE IF EXISTS "_ponder_meta" CASCADE;
DROP TABLE IF EXISTS "_ponder_reorg" CASCADE;
DROP TABLE IF EXISTS "ponder_cache" CASCADE;
DROP TABLE IF EXISTS "ponder_sync_state" CASCADE;

-- Alternative: If you want to keep the schema but clear data
-- TRUNCATE TABLE "CollectionStat", "Holder", "UserBalance", "NFT", "Mint" RESTART IDENTITY CASCADE;
-- DELETE FROM "_ponder_meta";
-- DELETE FROM "_ponder_reorg";