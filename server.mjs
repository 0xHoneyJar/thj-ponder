#!/usr/bin/env node

// Simple HTTP server wrapper for Ponder on Railway
import { spawn } from 'child_process';
import http from 'http';
import httpProxy from 'http-proxy';

const RAILWAY_PORT = process.env.PORT || 8080;
const PONDER_PORT = 42069;

console.log('🚂 Railway Ponder Server');
console.log(`📍 Railway expects port: ${RAILWAY_PORT}`);
console.log(`🎯 Ponder will run on: ${PONDER_PORT}`);

// Start Ponder on internal port
console.log('🚀 Starting Ponder indexer...');
const ponder = spawn('pnpm', ['ponder', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(PONDER_PORT),
    HOST: '127.0.0.1'
  }
});

// Give Ponder time to start
setTimeout(() => {
  console.log('🔄 Starting proxy server...');
  
  // Create a simple proxy
  const proxy = httpProxy.createProxyServer({
    target: `http://127.0.0.1:${PONDER_PORT}`,
    changeOrigin: true
  });

  // Handle errors
  proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (res.writeHead) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service temporarily unavailable' }));
    }
  });

  // Create the server
  const server = http.createServer((req, res) => {
    // Add CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // Handle health checks immediately
    if (req.url === '/health' || req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', service: 'ponder' }));
      return;
    }
    
    // Proxy everything else
    proxy.web(req, res);
  });

  // Listen on all interfaces for Railway
  server.listen(RAILWAY_PORT, '0.0.0.0', () => {
    console.log(`✅ Proxy listening on 0.0.0.0:${RAILWAY_PORT}`);
    console.log(`🎯 Proxying to Ponder on 127.0.0.1:${PONDER_PORT}`);
  });

}, 5000); // Wait 5 seconds for Ponder to initialize

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  ponder.kill();
  process.exit(0);
});