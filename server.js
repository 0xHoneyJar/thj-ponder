#!/usr/bin/env node

// Simple wrapper to ensure Ponder starts with correct port
const { spawn } = require('child_process');

const port = process.env.PORT || 8080;

console.log('🚀 Starting Ponder server...');
console.log(`📍 Port: ${port}`);
console.log(`🌐 Host: 0.0.0.0`);
console.log(`🔗 Railway URL: https://thj-ponder-production.up.railway.app`);

// Set environment variables
process.env.PORT = port;
process.env.HOST = '0.0.0.0';
process.env.HOSTNAME = '0.0.0.0';

// Start Ponder
const ponder = spawn('pnpm', ['ponder', 'start'], {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true
});

ponder.on('error', (err) => {
  console.error('Failed to start Ponder:', err);
  process.exit(1);
});

ponder.on('close', (code) => {
  console.log(`Ponder exited with code ${code}`);
  process.exit(code);
});