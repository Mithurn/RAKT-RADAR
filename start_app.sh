#!/bin/bash

echo "🚀 Starting RAKT-RADAR Application..."
echo "======================================"

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Stopping all services..."
    pkill -f "python src/main.py"
    pkill -f "pnpm run dev"
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting Flask Backend (Port 8000)..."
cd rakt_radar_backend
source venv/bin/activate
python src/main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/api/analytics/dashboard > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend failed to start"
    cleanup
fi

# Start frontend
echo "🎨 Starting React Frontend (Port 5173)..."
cd rakt-radar-frontend
pnpm run dev --host &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend failed to start"
    cleanup
fi

echo ""
echo "🎉 RAKT-RADAR is now running!"
echo "📊 Backend API: http://localhost:8000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
