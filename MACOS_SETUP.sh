#!/bin/bash

echo "===================================="
echo "   RAKT-RADAR macOS Setup Script"
echo "===================================="
echo

echo "[1/4] Setting up Backend..."
cd rakt_radar_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "Backend dependencies installed!"
echo

echo "[2/4] Setting up Frontend..."
cd ../rakt-radar-frontend
npm install
echo "Frontend dependencies installed!"
echo

echo "[3/4] Starting Backend Server..."
cd ../rakt_radar_backend
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && source venv/bin/activate && python src/main.py"'
echo "Backend server starting on http://localhost:5000"
sleep 5

echo "[4/4] Starting Frontend Server..."
cd ../rakt-radar-frontend
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"'
echo "Frontend server starting on http://localhost:5173"
echo

echo "===================================="
echo "    Setup Complete!"
echo "===================================="
echo
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo
echo "Opening browser in 10 seconds..."
sleep 10
open http://localhost:5173
echo
echo "Demo is ready!"

