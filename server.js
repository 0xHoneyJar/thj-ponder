import { spawn } from 'child_process';

const PORT = process.env.PORT || 8080;

console.log(`Starting Ponder on Railway port ${PORT}...`);

// Debug: Log the DATABASE_URL (without password)
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
  console.log(`DATABASE_URL configured: ${maskedUrl}`);
} else {
  console.log('WARNING: DATABASE_URL not found in environment variables');
}

// Start Ponder with Railway's PORT - keep it simple
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