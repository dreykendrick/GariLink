#!/bin/sh
# Railway start script
echo "Starting GariLink API..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"
echo "Listing dist/src/:"
ls -la dist/src/ 2>/dev/null || echo "dist/src/ not found!"
exec node dist/src/main.js
