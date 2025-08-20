import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = process.env.PORT || 8080;

console.log(`Starting Ponder on Railway port ${PORT}...`);

// Check if we should force a re-index
const FORCE_REINDEX = process.env.FORCE_REINDEX === 'true';

async function clearPonderTables() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, skipping table reset');
    return;
  }

  console.log('🔄 Forcing database re-index...');
  
  // SQL to drop Ponder's internal tracking tables
  const dropTablesSQL = `
    DROP TABLE IF EXISTS "_ponder_meta" CASCADE;
    DROP TABLE IF EXISTS "_ponder_reorg" CASCADE;
    DROP TABLE IF EXISTS "ponder_cache" CASCADE;
    DROP TABLE IF EXISTS "ponder_sync_state" CASCADE;
    DROP TABLE IF EXISTS "_ponder_checkpoints" CASCADE;
    DROP TABLE IF EXISTS "_ponder_instance" CASCADE;
    
    -- Also drop our data tables to ensure clean state
    DROP TABLE IF EXISTS "CollectionStat" CASCADE;
    DROP TABLE IF EXISTS "Holder" CASCADE;
    DROP TABLE IF EXISTS "UserBalance" CASCADE;
    DROP TABLE IF EXISTS "NFT" CASCADE;
    DROP TABLE IF EXISTS "Mint" CASCADE;
  `;

  try {
    // Use psql to execute the SQL
    await execAsync(`psql "${process.env.DATABASE_URL}" -c "${dropTablesSQL}"`);
    console.log('✅ Database tables cleared for re-indexing');
  } catch (error) {
    console.error('⚠️ Could not clear tables (may not exist yet):', error.message);
  }
}

async function startPonder() {
  // Clear tables if FORCE_REINDEX is set
  if (FORCE_REINDEX) {
    await clearPonderTables();
  }

  // Clear local cache
  try {
    await execAsync('rm -rf .ponder .ponder-cache');
    console.log('✅ Local cache cleared');
  } catch (error) {
    console.error('⚠️ Could not clear local cache:', error.message);
  }

  // Start Ponder with Railway's PORT
  const ponder = spawn('pnpm', ['ponder', 'start', '--port', PORT, '--hostname', '0.0.0.0'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: PORT,
      HOSTNAME: '0.0.0.0',
      HOST: '0.0.0.0'
    }
  });

  ponder.on('error', (err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });

  ponder.on('exit', (code) => {
    process.exit(code);
  });
}

// Start the process
startPonder();