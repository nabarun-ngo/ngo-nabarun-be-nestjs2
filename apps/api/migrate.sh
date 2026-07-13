#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting database migration..."

# Ensure required environment variables exist
if [ -z "$DOPPLER_TOKEN" ] || [ -z "$DOPPLER_PROJECT" ] || [ -z "$DOPPLER_CONFIG" ]; then
  echo "❌ Missing Doppler configuration environment variables"
  exit 1
fi

# Run migrations using Doppler and Prisma
doppler run \
  --token="$DOPPLER_TOKEN" \
  --project="$DOPPLER_PROJECT" \
  --config="$DOPPLER_CONFIG" \
  -- npx prisma migrate deploy

echo "✅ Database migrations completed successfully."
