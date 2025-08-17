#!/usr/bin/env node
import { spawn } from 'child_process';
import { createServer } from 'http';
import httpProxy from 'http-proxy';

const PORT = process.env.PORT || 8080;

console.log('🚀 Railway Ponder Wrapper');
console.log(`📍 Public Port: ${PORT}`);
console.log(`🔧 Ponder Port: 42069 (internal)`);

// Create proxy to forward requests to Ponder
const proxy = httpProxy.createProxyServer({
  target: 'http://127.0.0.1:42069',
  changeOrigin: true,
  ws: true
});

// Create server that binds to 0.0.0.0
const server = createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'ponder-proxy' }));
    return;
  }

  // Proxy all other requests to Ponder
  proxy.web(req, res, {}, (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Ponder service not available',
      message: err.message 
    }));
  });
});

// Start proxy server on 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Proxy server listening on 0.0.0.0:${PORT}`);
  console.log(`🔄 Proxying requests to Ponder on 127.0.0.1:42069`);
});

// Start Ponder on localhost only
const ponder = spawn('pnpm', ['ponder', 'start', '--port', '42069'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '42069',
    HOST: '127.0.0.1' // Bind Ponder to localhost only
  }
});

ponder.on('error', (err) => {
  console.error('❌ Failed to start Ponder:', err);
  process.exit(1);
});

ponder.on('exit', (code) => {
  console.log(`Ponder process exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close();
  ponder.kill();
  process.exit(0);
});