#!/bin/bash

# Claude Code Observability System - Startup Script
echo "🚀 Starting Claude Code Observability System..."

# Change to project root directory
cd "$(dirname "$0")"

# Function to check if port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Kill existing processes on ports 3000 and 4000
echo "🧹 Cleaning up existing processes..."
if check_port 4000; then
    echo "  ⚠️  Killing existing process on port 4000..."
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
fi

if check_port 3000; then
    echo "  ⚠️  Killing existing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd apps/server
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "  Installing npm packages for server..."
    npm install
else
    echo "  ✅ Server dependencies already installed"
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "  Installing npm packages for client..."
    npm install
else
    echo "  ✅ Client dependencies already installed"
fi

# Go back to project root
cd ../..

echo "🔧 Starting services..."

# Start Express server in background
echo "  🖥️  Starting Express server on port 4000..."
cd apps/server
npm run dev > server.log 2>&1 &
SERVER_PID=$!
cd ../..

# Wait for server to start
echo "  ⏳ Waiting for server to initialize..."
for i in {1..10}; do
    if curl -s http://localhost:4000/health >/dev/null 2>&1; then
        echo "  ✅ Express server is ready!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "  ❌ Server failed to start. Check apps/server/server.log for details."
        exit 1
    fi
    sleep 2
done

# Start Next.js frontend in background
echo "  🌐 Starting Next.js frontend on port 3000..."
cd apps/client
npm run dev > client.log 2>&1 &
CLIENT_PID=$!
cd ../..

# Wait for frontend to start
echo "  ⏳ Waiting for frontend to initialize..."
for i in {1..15}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "  ✅ Next.js frontend is ready!"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "  ⚠️  Frontend taking longer than expected. It may still be starting..."
        break
    fi
    sleep 3
done

echo ""
echo "🎉 Claude Code Observability System is running!"
echo ""
echo "📊 Dashboard:      http://localhost:3000"
echo "🔧 API Server:     http://localhost:4000"
echo "📡 Health Check:   http://localhost:4000/health"
echo "🔌 WebSocket:      ws://localhost:4000/ws"
echo ""
echo "📋 Server Logs:    apps/server/server.log"
echo "📋 Client Logs:    apps/client/client.log"
echo ""
echo "💡 Tips:"
echo "  - Use Claude Code in this directory to see hook events"
echo "  - Check the dashboard to see events in real-time"
echo "  - Run './stop.sh' to shutdown the system"
echo ""
echo "🔄 System will continue running in the background..."
echo "   Process IDs: Server=$SERVER_PID, Client=$CLIENT_PID"

# Save PIDs for stop script
echo "$SERVER_PID" > .server.pid
echo "$CLIENT_PID" > .client.pid