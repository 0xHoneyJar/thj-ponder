import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Proxy all requests to Ponder running on localhost:42069
const proxy = createProxyMiddleware({
  target: 'http://localhost:42069',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ 
      error: 'Ponder service not available',
      message: 'The indexer is still starting up or not running'
    });
  }
});

app.use('/', proxy);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Proxy server listening on 0.0.0.0:${PORT}`);
  console.log(`🎯 Proxying to Ponder on localhost:42069`);
});

// Start Ponder in background
import { spawn } from 'child_process';
const ponder = spawn('pnpm', ['ponder', 'start'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '42069' }
});

ponder.on('error', (err) => {
  console.error('Failed to start Ponder:', err);
});