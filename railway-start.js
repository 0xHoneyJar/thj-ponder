import { spawn } from 'child_process';
import { createServer } from 'http';

const port = process.env.PORT || 8080;

console.log('🚀 Railway Ponder Startup');
console.log(`📍 Port: ${port}`);
console.log(`🌐 Host: 0.0.0.0`);

// Create a simple HTTP server to handle health checks while Ponder starts
const healthServer = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting', message: 'Ponder is initializing...' }));
  } else {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting', message: 'Service starting up...' }));
  }
});

// Start temporary health server
healthServer.listen(port, '0.0.0.0', () => {
  console.log(`🔥 Temporary health server listening on 0.0.0.0:${port}`);
});

// Set all necessary environment variables
process.env.PORT = String(port);
process.env.HOST = '0.0.0.0';
process.env.HOSTNAME = '0.0.0.0';
process.env.PONDER_PORT = String(port);

// Start Ponder with proper configuration
console.log('🎯 Starting Ponder with environment:');
console.log(`   PORT=${process.env.PORT}`);
console.log(`   HOST=${process.env.HOST}`);

const ponder = spawn('pnpm', ['ponder', 'start', '--port', String(port)], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

// Once Ponder starts, close the temporary server
setTimeout(() => {
  console.log('🔄 Closing temporary health server, Ponder should be running...');
  healthServer.close();
}, 15000);

ponder.on('error', (err) => {
  console.error('❌ Failed to start Ponder:', err);
  process.exit(1);
});

ponder.on('exit', (code) => {
  console.log(`Ponder process exited with code ${code}`);
  process.exit(code || 0);
});