#!/bin/sh

# Simple start script that ensures proper environment
echo "Starting Ponder..."
echo "PORT: ${PORT:-8080}"

# Export all necessary variables
export PORT=${PORT:-8080}
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0

# Ponder should pick up PORT from environment
exec pnpm ponder start