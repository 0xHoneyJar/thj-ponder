#!/bin/sh

# Railway provides PORT environment variable
export PORT=${PORT:-42069}

# Ensure we bind to all interfaces (0.0.0.0) not just localhost
export HOST=0.0.0.0

echo "Starting Ponder on port $PORT..."
echo "Host: $HOST"

# Start Ponder with explicit port
ponder start --port $PORT