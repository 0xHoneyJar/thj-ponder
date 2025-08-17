#!/usr/bin/env node

// Direct start for Railway - let Ponder handle everything
console.log('🚀 Starting Ponder directly on Railway');
console.log(`📍 PORT: ${process.env.PORT || 42069}`);

// Set environment to bind to all interfaces
process.env.HOST = '0.0.0.0';
process.env.HOSTNAME = '0.0.0.0';

// Import and run Ponder CLI directly
import { spawn } from 'child_process';

const ponder = spawn('pnpm', ['ponder', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: '0.0.0.0',
    HOSTNAME: '0.0.0.0'
  }
});

ponder.on('error', (err) => {
  console.error('Failed to start Ponder:', err);
  process.exit(1);
});

ponder.on('exit', (code) => {
  process.exit(code || 0);
});