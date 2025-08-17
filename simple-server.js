const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 8080;

console.log('Starting Ponder for Railway...');
console.log('Port:', PORT);

// Create a basic health check server first
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting', message: 'Ponder is initializing' }));
  } else {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting', message: 'Service starting up' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server on 0.0.0.0:${PORT}`);
  
  // Now start Ponder
  console.log('Starting Ponder indexer...');
  const ponder = spawn('pnpm', ['ponder', 'start', '--port', PORT], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: PORT,
      HOST: '0.0.0.0'
    },
    shell: true
  });
  
  // After Ponder starts, close our temporary server
  setTimeout(() => {
    console.log('Closing temporary server, Ponder should be running...');
    server.close();
  }, 10000);
  
  ponder.on('error', (err) => {
    console.error('Failed to start Ponder:', err);
    process.exit(1);
  });
});