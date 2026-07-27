#!/bin/sh
set -e

# Default environment variables for Railway / Cloud deployment
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="production"

if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/db/custom.db"
fi

echo "🚀 Starting LearnX AI Server on HOSTNAME=$HOSTNAME PORT=$PORT..."
echo "📊 Database URL: $DATABASE_URL"

# Ensure db directory exists and is writable
mkdir -p /app/db

# Execute Next.js standalone server
exec node server.js
