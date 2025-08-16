@echo off
echo 🚀 Starting RAKT-RADAR Application...
echo ======================================

REM Start backend
echo 🔧 Starting Flask Backend (Port 8000)...
cd rakt_radar_backend
call venv\Scripts\activate
start "Backend" python src\main.py
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo 🎨 Starting React Frontend (Port 5173)...
cd rakt-radar-frontend
start "Frontend" pnpm run dev --host
cd ..

echo.
echo 🎉 RAKT-RADAR is now starting!
echo 📊 Backend API: http://localhost:8000
echo 🌐 Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the services
echo.
pause
