import { spawn } from 'child_process';

const PORT = process.env.PORT || 8080;

console.log(`Starting Ponder on Railway port ${PORT}...`);

// Force a new schema to bypass corrupted sync state in PostgreSQL
// This will create a fresh schema and avoid the corrupted block numbers
const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const freshSchema = `thj_mainnet_${timestamp}`;

console.log(`Using fresh database schema: ${freshSchema}`);

// Start Ponder with Railway's PORT and fresh schema
const ponder = spawn('pnpm', ['ponder', 'start', '--port', PORT, '--hostname', '0.0.0.0'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT,
    HOSTNAME: '0.0.0.0',
    HOST: '0.0.0.0',
    // Override Railway's default schema to force a clean slate
    PONDER_DATABASE_SCHEMA: freshSchema
  }
});

ponder.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

ponder.on('exit', (code) => {
  process.exit(code);
});