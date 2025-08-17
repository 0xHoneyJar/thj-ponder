import { spawn } from 'child_process';

const PORT = process.env.PORT || 8080;

console.log(`Starting Ponder on Railway port ${PORT}...`);

// Parse the DATABASE_URL to ensure it has a database name
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && !databaseUrl.includes('/railway')) {
  // If the URL doesn't have a database name, add 'railway' as default
  databaseUrl = databaseUrl.replace(/\/null$/, '/railway').replace(/\/$/, '/railway');
  console.log(`Fixed DATABASE_URL to include database name`);
}

// Force a new schema to bypass any corrupted sync state
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
    // Fix the DATABASE_URL if needed
    DATABASE_URL: databaseUrl || process.env.DATABASE_URL,
    // Override Railway's deployment ID to force using our schema
    RAILWAY_DEPLOYMENT_ID: freshSchema,
    // Also set PONDER_DATABASE_SCHEMA as backup
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