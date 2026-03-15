#!/bin/sh
set -e

echo "Running database migrations..."
(cd /app/apps/web && ./node_modules/.bin/prisma migrate deploy)

echo "Starting server..."
exec node /app/apps/web/server.js
