#!/bin/bash
set -e

echo "Building API server..."
pnpm --filter @workspace/api-server run build

echo "Starting API server on port 8080..."
PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run start &
API_PID=$!

echo "Starting dashboard on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/dashboard run dev &
DASH_PID=$!

# If either process exits, kill both and exit
wait -n
kill $API_PID $DASH_PID 2>/dev/null
wait
