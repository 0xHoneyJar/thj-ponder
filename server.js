import { spawn } from 'child_process';

const PORT = process.env.PORT || 8080;

console.log(`Starting Ponder on Railway port ${PORT}...`);

// Force a new schema to avoid corrupted data
const FORCE_NEW_SCHEMA = `thj_ponder_mainnet_${Date.now()}`;

// Start Ponder with Railway's PORT and forced new schema
const ponder = spawn('pnpm', ['ponder', 'start', '--port', PORT, '--hostname', '0.0.0.0'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT,
    HOSTNAME: '0.0.0.0',
    HOST: '0.0.0.0',
    // Override the schema name to force a fresh start
    PONDER_DATABASE_SCHEMA: FORCE_NEW_SCHEMA
  }
});

ponder.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

ponder.on('exit', (code) => {
  process.exit(code);
});