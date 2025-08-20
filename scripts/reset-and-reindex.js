#!/usr/bin/env node

import pg from 'pg';
import { config } from 'dotenv';

config();

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('📊 Connected to database');

    // List all tables before dropping
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log('Current tables:', tablesResult.rows.map(r => r.tablename).join(', '));

    // Drop Ponder's internal tracking tables
    const tablesToDrop = [
      // Ponder internal tables (various versions use different names)
      '_ponder_meta',
      '_ponder_reorg', 
      '_ponder_checkpoints',
      '_ponder_instance',
      'ponder_cache',
      'ponder_sync_state',
      
      // Your data tables
      'CollectionStat',
      'Holder',
      'UserBalance',
      'NFT',
      'Mint'
    ];

    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${table}: ${error.message}`);
      }
    }

    // Verify all tables are dropped
    const remainingTables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    if (remainingTables.rows.length > 0) {
      console.log('⚠️ Remaining tables:', remainingTables.rows.map(r => r.tablename).join(', '));
    } else {
      console.log('✅ All tables cleared successfully');
    }

    console.log('\n🎉 Database reset complete!');
    console.log('📝 Next steps:');
    console.log('1. Deploy to Railway: git push');
    console.log('2. Or set FORCE_REINDEX=true in Railway environment variables');
    console.log('3. Ponder will re-index from the configured start blocks');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();