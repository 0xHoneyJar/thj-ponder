import { spawn } from 'child_process';

const PORT = process.env.PORT || 8080;

console.log(`Starting Ponder on Railway port ${PORT}...`);

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