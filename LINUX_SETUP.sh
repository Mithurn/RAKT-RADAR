#!/bin/bash

echo "===================================="
echo "   RAKT-RADAR Linux Setup Script"
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
gnome-terminal -- bash -c "source venv/bin/activate && python src/main.py; exec bash" 2>/dev/null || \
xterm -e "bash -c 'source venv/bin/activate && python src/main.py; exec bash'" 2>/dev/null || \
konsole -e bash -c "source venv/bin/activate && python src/main.py; exec bash" 2>/dev/null || \
echo "Please manually run: cd rakt_radar_backend && source venv/bin/activate && python src/main.py"
echo "Backend server starting on http://localhost:5000"
sleep 5

echo "[4/4] Starting Frontend Server..."
cd ../rakt-radar-frontend
gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -e "bash -c 'npm run dev; exec bash'" 2>/dev/null || \
konsole -e bash -c "npm run dev; exec bash" 2>/dev/null || \
echo "Please manually run: cd rakt-radar-frontend && npm run dev"
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
xdg-open http://localhost:5173 2>/dev/null || \
firefox http://localhost:5173 2>/dev/null || \
google-chrome http://localhost:5173 2>/dev/null || \
echo "Please manually open: http://localhost:5173"
echo
echo "Demo is ready!"

