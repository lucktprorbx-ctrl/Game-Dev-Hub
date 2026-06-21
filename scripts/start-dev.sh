#!/bin/bash
set -e

# Start the API server in the background on port 8080
PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run start &
API_PID=$!

# Start the dashboard (foreground, port 5000 for Replit webview)
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/dashboard run dev &
DASH_PID=$!

# If either process exits, kill both and exit
wait -n
kill $API_PID $DASH_PID 2>/dev/null
wait
