#!/bin/bash

# Claude Code Observability System - Startup Script
echo "🚀 Starting Claude Code Observability System..."

# Change to project root directory
cd "$(dirname "$0")"

# Function to check if port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Claude Code Observability System..."
    
    # Kill any processes on our ports
    if check_port 4000; then
        echo "  🔧 Stopping Express server (port 4000)..."
        lsof -ti:4000 | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port 5173; then
        echo "  🌐 Stopping Vue.js client (port 5173)..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port 3000; then
        echo "  ⚛️  Stopping Next.js client (port 3000)..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    echo "✅ System shutdown complete"
    exit 0
}

# Set up signal handling for graceful shutdown
trap cleanup SIGINT SIGTERM

# Kill existing processes on ports 4000 and 5173
echo "🧹 Cleaning up existing processes..."
if check_port 4000; then
    echo "  ⚠️  Killing existing process on port 4000..."
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
fi

if check_port 5173; then
    echo "  ⚠️  Killing existing process on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

if check_port 3000; then
    echo "  ⚠️  Killing existing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd apps/server
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "  Installing npm packages for server..."
    npm install
else
    echo "  ✅ Server dependencies already installed"
fi

# Install Next.js client dependencies
echo "📦 Installing Next.js client dependencies..."
cd ../client
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "  Installing npm packages for Next.js client..."
    npm install
else
    echo "  ✅ Next.js client dependencies already installed"
fi

# Install Vue.js client dependencies (backup)
echo "📦 Installing Vue.js client dependencies..."
cd ../client-vue-backup
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "  Installing npm packages for Vue.js client..."
    npm install
else
    echo "  ✅ Vue.js client dependencies already installed"
fi

# Check if concurrently is available
if ! command -v npx >/dev/null 2>&1; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

# Go back to project root
cd ../..

echo "🔧 Starting services with live logs..."
echo ""
echo "🎉 Claude Code Observability System starting!"
echo ""
echo "⚛️  Next.js Dashboard:  http://localhost:3000"
echo "🌐 Vue.js Dashboard:   http://localhost:5173"
echo "🔧 API Server:         http://localhost:4000"
echo "📡 Health Check:       http://localhost:4000/health"
echo "🔌 WebSocket:          ws://localhost:4000/stream"
echo ""
echo "💡 Tips:"
echo "  - Use Claude Code in this directory to see hook events"
echo "  - Compare Next.js vs Vue.js implementations side-by-side"
echo "  - Both dashboards show the same real-time data"
echo "  - Press Ctrl+C to shutdown the system"
echo ""
echo "🔄 Starting services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Use npx to run concurrently without installing globally
npx concurrently \
  --names "SERVER,NEXT,VUE" \
  --prefix "[{name}]" \
  --prefix-colors "blue,cyan,green" \
  --kill-others-on-fail \
  --restart-tries 3 \
  "cd apps/server && npm run dev" \
  "cd apps/client && npm run dev" \
  "cd apps/client-vue-backup && npm run dev"

# This line should not be reached unless concurrently fails
echo ""
echo "❌ Services stopped unexpectedly"
cleanup