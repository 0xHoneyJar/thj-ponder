#!/bin/bash

# Railway-specific start script
echo "🚀 Starting Ponder on Railway"
echo "PORT: ${PORT:-42069}"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..." 

# Ponder uses PORT environment variable directly
# No need for complex proxying - let Ponder handle it
exec pnpm ponder start