# 🚀 RAKT-RADAR Hackathon Demo Deployment Guide

## 🎯 **DEMO OVERVIEW**
**RAKT-RADAR** is an AI-powered emergency blood delivery system that demonstrates real-time coordination across 3 different user roles in a hackathon setting.

### **Demo Flow:**
1. **Hospital** creates emergency blood request → AI finds optimal blood unit
2. **Blood Bank** receives instant notification → approves request
3. **Driver** gets route assignment → real-time tracking across all 3 views
4. **Live coordination** shows the complete emergency response workflow

---

## 🖥️ **SYSTEM ARCHITECTURE**

### **Backend (Flask + SQLite)**
- **Port**: 8000
- **Database**: SQLite with 120+ blood units, 40 hospitals, 35 blood banks
- **Real-time**: HTTP polling endpoints for cross-laptop communication
- **CORS**: Enabled for multi-laptop demo

### **Frontend (React + Vite)**
- **Port**: 5174 (development) / 3000 (production)
- **Real-time Service**: Polling-based updates every 2-5 seconds
- **Role-based Views**: Hospital, Blood Bank, Driver dashboards

---

## 🚀 **QUICK START (3 Laptops)**

### **Laptop 1: Backend Server**
```bash
# Terminal 1: Start Backend
cd rakt_radar_backend
source venv/bin/activate  # or: python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python src/main.py

# Expected Output:
🚀 RAKT-RADAR 3-POV Demo System starting...
📊 Database initialized with demo data
🔑 Demo users created successfully
🌐 Starting Flask server on http://localhost:8000
📡 Real-time endpoints available:
   - /api/realtime/emergency-requests
   - /api/realtime/driver-updates
   - /api/realtime/status
🔌 CORS enabled for multi-laptop demo
```

### **Laptop 2: Hospital + Blood Bank Views**
```bash
# Terminal 2: Start Frontend
cd rakt-radar-frontend
npm install  # or: pnpm install
npm run dev --host  # or: pnpm run dev --host

# Expected Output:
VITE v5.x.x ready in xxx ms
➜ Local:   http://localhost:5174/
➜ Network: http://192.168.x.x:5174/
```

### **Laptop 3: Driver View**
```bash
# Terminal 3: Start Frontend (different port)
cd rakt-radar-frontend
npm run dev --host --port 5175  # or: pnpm run dev --host --port 5175
```

---

## 🌐 **NETWORK CONFIGURATION**

### **Option 1: Same WiFi Network (Recommended)**
- All laptops connect to same WiFi
- Use laptop IP addresses for communication
- Backend: `http://192.168.x.x:8000`
- Frontend 1: `http://192.168.x.x:5174`
- Frontend 2: `http://192.168.x.x:5175`

### **Option 2: Localhost (Single Laptop Demo)**
- Run all services on one laptop
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5174`

### **Option 3: Production Deployment**
- Deploy backend to cloud (Heroku, Railway, etc.)
- Deploy frontend to Vercel, Netlify, etc.
- Use production URLs for all communication

---

## 🔧 **CONFIGURATION FILES**

### **Backend Configuration**
```python
# rakt_radar_backend/src/main.py
app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
CORS(app, supports_credentials=True, origins=["*"])
```

### **Frontend Configuration**
```javascript
// rakt-radar-frontend/src/services/realtimeService.js
this.baseUrl = 'http://192.168.x.x:8000';  // Change to your backend IP
```

---

## 📱 **DEMO USER CREDENTIALS**

### **Hospital Users**
- **Email**: `admin@apollohospitals.com`
- **Password**: `hospital123`
- **Role**: Hospital Admin

### **Blood Bank Users**
- **Email**: `admin@chennaibloodbank.com`
- **Password**: `bank123`
- **Role**: Blood Bank Admin

### **Driver Users**
- **Email**: `driver@raktradar.com`
- **Password**: `driver123`
- **Role**: Delivery Driver

---

## 🎬 **DEMO SCRIPT**

### **Step 1: Hospital Creates Emergency Request**
1. Open **Laptop 2** → Hospital Dashboard
2. Login with hospital credentials
3. Navigate to "Smart Routing" or "Emergency Requests"
4. Create request: **B+ blood, 300ml, High urgency**
5. AI will find optimal blood bank and show route

### **Step 2: Blood Bank Approves Request**
1. Open **Laptop 2** → Blood Bank Dashboard (new tab)
2. Login with blood bank credentials
3. See pending emergency request appear
4. Click "Approve" to assign driver

### **Step 3: Driver Receives Route**
1. Open **Laptop 3** → Driver Dashboard
2. Login with driver credentials
3. See assigned route with hospital pickup details
4. Click "Start Delivery" to begin tracking

### **Step 4: Live Tracking (All 3 Views)**
- **Hospital**: See driver location and ETA
- **Blood Bank**: Monitor delivery progress
- **Driver**: Update location and delivery status
- **All views update in real-time** every 2-5 seconds

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **1. CORS Errors**
```bash
# Backend: Ensure CORS is enabled
CORS(app, supports_credentials=True, origins=["*"])

# Frontend: Check baseUrl in realtimeService.js
this.baseUrl = 'http://YOUR_BACKEND_IP:8000';
```

#### **2. Database Issues**
```bash
# Re-seed database
cd rakt_radar_backend
python -c "from src.mock_data import populate_mock_data; from src.models.models import db; from flask import Flask; app = Flask(__name__); app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rakt_radar.db'; db.init_app(app); app.app_context().push(); populate_mock_data()"
```

#### **3. Port Conflicts**
```bash
# Check what's using port 8000
lsof -i :8000

# Kill process if needed
kill -9 <PID>

# Or use different port
python src/main.py --port 8001
```

#### **4. Network Issues**
```bash
# Test backend connectivity
curl http://BACKEND_IP:8000/api/realtime/status

# Test frontend connectivity
curl http://FRONTEND_IP:5174
```

---

## 📊 **DEMO FEATURES TO HIGHLIGHT**

### **AI/ML Capabilities**
- **Smart Blood Matching**: AI finds optimal blood units based on type, distance, expiry
- **Route Optimization**: Calculates fastest delivery routes
- **ETA Prediction**: ML-based delivery time estimates
- **Confidence Scoring**: AI confidence in recommendations

### **Real-time Coordination**
- **Instant Notifications**: All parties notified simultaneously
- **Live Tracking**: Real-time driver location updates
- **Status Synchronization**: All views show same information
- **Cross-laptop Communication**: Works across different devices

### **Emergency Response Workflow**
- **Hospital Request** → **AI Analysis** → **Blood Bank Approval** → **Driver Assignment** → **Live Delivery Tracking**

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **Backend (Heroku/Railway)**
```bash
# Add Procfile
web: gunicorn src.main:app

# Add gunicorn to requirements.txt
gunicorn==21.2.0

# Deploy
git push heroku main
```

### **Frontend (Vercel/Netlify)**
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or drag dist/ folder to Netlify
```

---

## 📞 **SUPPORT & CONTACT**

### **For Hackathon Judges**
- **Demo Duration**: 5-7 minutes
- **Key Points**: AI blood matching, real-time coordination, emergency response
- **Technical Stack**: Flask + React + SQLite + AI/ML algorithms

### **For Technical Questions**
- **Architecture**: HTTP polling for reliability
- **Database**: SQLite with 120+ blood units
- **Real-time**: 2-5 second update intervals
- **Scalability**: Can handle 100+ concurrent requests

---

## 🎯 **SUCCESS CRITERIA**

✅ **All 3 laptops show real-time updates**  
✅ **Emergency request flows from Hospital → Blood Bank → Driver**  
✅ **AI successfully matches blood units**  
✅ **Live tracking works across all views**  
✅ **System handles multiple concurrent requests**  
✅ **Demo runs smoothly without technical issues**  

---

**🚀 Ready for your hackathon demo! This system will impress judges with its real-time coordination, AI capabilities, and emergency response workflow.**
