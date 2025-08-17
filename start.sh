#!/bin/sh

# Railway provides PORT environment variable - use it directly
export PONDER_PORT=${PORT:-8080}

# Ensure we bind to all interfaces (0.0.0.0) not just localhost
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0

echo "Starting Ponder..."
echo "PORT from Railway: $PORT"
echo "Using port: $PONDER_PORT"
echo "Host: $HOST"

# Start Ponder - it should pick up the PORT env var
PORT=$PONDER_PORT ponder start