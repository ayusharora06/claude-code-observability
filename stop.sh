#!/bin/bash

# Claude Code Observability System - Stop Script
echo "🛑 Stopping Claude Code Observability System..."

# Change to project root directory
cd "$(dirname "$0")"

# Function to check if port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process by PID if it exists
kill_pid() {
    if [ -f "$1" ]; then
        PID=$(cat "$1")
        if ps -p $PID > /dev/null 2>&1; then
            echo "  🔪 Killing process $PID..."
            kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
        fi
        rm -f "$1"
    fi
}

# Kill processes using saved PIDs
echo "🧹 Stopping background processes..."
kill_pid ".server.pid"
kill_pid ".client.pid"

# Kill any remaining processes on our ports
if check_port 4000; then
    echo "  🔪 Killing remaining process on port 4000..."
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
fi

if check_port 3000; then
    echo "  🔪 Killing remaining process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# Kill any npm dev processes for this project
echo "🧹 Cleaning up npm processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true

# Clean up log files
echo "🧹 Cleaning up log files..."
rm -f apps/server/server.log
rm -f apps/client/client.log

# Verify ports are free
sleep 2
if check_port 4000; then
    echo "  ⚠️  Warning: Port 4000 may still be in use"
else
    echo "  ✅ Port 4000 is free"
fi

if check_port 3000; then
    echo "  ⚠️  Warning: Port 3000 may still be in use"
else
    echo "  ✅ Port 3000 is free"
fi

echo ""
echo "✅ Claude Code Observability System stopped"
echo ""
echo "💡 To restart the system, run: ./start.sh"