#!/bin/bash

echo "🚀 Starting RAKT-RADAR 3-POV Demo System..."
echo "============================================="

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

# Check if virtual environment exists
if [ ! -d "rakt_radar_backend/venv" ]; then
    echo "❌ Virtual environment not found. Please create it first:"
    echo "   cd rakt_radar_backend"
    echo "   python -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "rakt-radar-frontend/node_modules" ]; then
    echo "❌ Node modules not found. Please install dependencies first:"
    echo "   cd rakt-radar-frontend"
    echo "   pnpm install"
    exit 1
fi

# Start backend
echo "🔧 Starting Flask Backend (Port 8000)..."
cd rakt_radar_backend
source venv/bin/activate

echo "🚀 Starting backend server..."
python src/main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Check if backend is running
echo "🔍 Checking backend status..."
for i in {1..10}; do
    if curl -s http://localhost:8000/api/hospitals > /dev/null 2>&1; then
        echo "✅ Backend is running on http://localhost:8000"
        break
    else
        echo "⏳ Attempt $i/10: Backend not ready yet..."
        sleep 3
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Backend failed to start after 10 attempts"
        echo "🔍 Check backend logs for errors"
        cleanup
    fi
done

# Start frontend
echo "🎨 Starting React Frontend (Port 5173)..."
cd rakt-radar-frontend
pnpm run dev --host &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

# Check if frontend is running
echo "🔍 Checking frontend status..."
for i in {1..5}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend is running on http://localhost:5173"
        break
    else
        echo "⏳ Attempt $i/5: Frontend not ready yet..."
        sleep 3
    fi
    
    if [ $i -eq 5 ]; then
        echo "❌ Frontend failed to start after 5 attempts"
        echo "🔍 Check frontend logs for errors"
        cleanup
    fi
done

echo ""
echo "🎉 RAKT-RADAR 3-POV Demo System is now running!"
echo "================================================"
echo "📊 Backend API: http://localhost:8000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "🔑 Demo Credentials:"
echo "   Hospital: apollo_hospital / hospital123"
echo "   Blood Bank: chennai_blood_bank / bank123"
echo "   Driver: demo_driver / driver123"
echo "   Admin: admin / admin123"
echo ""
echo "📱 Demo Setup:"
echo "   • Laptop 1: Hospital POV (http://localhost:5173)"
echo "   • Laptop 2: Blood Bank POV (http://localhost:5173)"
echo "   • Laptop 3: Driver POV (http://localhost:5173)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
