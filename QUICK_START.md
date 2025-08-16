# 🚀 RAKT-RADAR Quick Start

## One Command to Run Everything!

### On macOS/Linux:
```bash
./start_app.sh
```

### On Windows:
```cmd
start_app.bat
```

## Manual Start (if needed):

### Backend (Flask API):
```bash
cd rakt_radar_backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python src/main.py
```

### Frontend (React):
```bash
cd rakt-radar-frontend
pnpm install
pnpm run dev --host
```

## Access Points:
- 🌐 **Frontend Dashboard**: http://localhost:5173
- 📊 **Backend API**: http://localhost:8000

## Stop All Services:
- Press `Ctrl+C` in the terminal where you ran the startup script
- Or close the terminal windows (Windows)

## What You'll See:
- **Overview**: Key metrics and blood type distribution
- **Inventory**: Units nearing expiry with alerts  
- **Intelligence**: AI-powered demand matching
- **Network**: Hospitals and blood banks listing

## Troubleshooting:
- If ports are busy, the script will show errors
- Check that Python 3.11+ and Node.js 20+ are installed
- Ensure `pnpm` is available (`npm install -g pnpm`)

---
**Note**: The backend runs on port 8000 (not 5000 as mentioned in some docs)
