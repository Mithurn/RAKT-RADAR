@echo off
echo ====================================
echo    RAKT-RADAR Windows Setup Script
echo ====================================
echo.

echo [1/4] Setting up Backend...
cd rakt_radar_backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
echo Backend dependencies installed!
echo.

echo [2/4] Setting up Frontend...
cd ..\rakt-radar-frontend
call npm install
echo Frontend dependencies installed!
echo.

echo [3/4] Starting Backend Server...
cd ..\rakt_radar_backend
start "RAKT-RADAR Backend" cmd /k "venv\Scripts\activate && python src\main.py"
echo Backend server starting on http://localhost:5000
timeout /t 5

echo [4/4] Starting Frontend Server...
cd ..\rakt-radar-frontend
start "RAKT-RADAR Frontend" cmd /k "npm run dev"
echo Frontend server starting on http://localhost:5173
echo.

echo ====================================
echo    Setup Complete!
echo ====================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser in 10 seconds...
timeout /t 10
start http://localhost:5173
echo.
echo Demo is ready! Press any key to exit.
pause

