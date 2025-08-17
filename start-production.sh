#!/bin/sh

# Railway production start script
# Ponder has two modes:
# - start: runs indexer + API (but API sometimes doesn't bind correctly)
# - serve: runs only API server (requires indexed data)

echo "🚀 Starting Ponder in production mode..."
echo "📍 PORT from Railway: ${PORT:-not set}"
echo "🌐 Binding to 0.0.0.0:${PORT:-8080}"

# Set environment for proper binding
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0

# First, run the indexer in background
echo "📊 Starting indexer..."
ponder start &
INDEXER_PID=$!

# Wait for indexer to initialize
echo "⏳ Waiting for indexer to initialize..."
sleep 10

# Then start the API server on Railway's port
echo "🌐 Starting API server on port ${PORT:-8080}..."
PORT=${PORT:-8080} ponder serve

# If serve fails, fall back to start
if [ $? -ne 0 ]; then
  echo "⚠️ Serve mode failed, falling back to start mode..."
  kill $INDEXER_PID 2>/dev/null
  PORT=${PORT:-8080} HOST=0.0.0.0 ponder start
fi