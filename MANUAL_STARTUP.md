# 🚀 Manual Startup Guide for RAKT-RADAR

## 🔧 **Step 1: Start Backend Manually**

Open **Terminal 1** and run:

```bash
cd rakt_radar_backend
source venv/bin/activate
python src/main.py
```

**Expected Output:**
```
🚀 RAKT-RADAR 3-POV Demo System starting...
📊 Database initialized with demo data
🔑 Demo users created successfully
🌐 Starting Flask server on http://localhost:8000
 * Running on http://0.0.0.0:8000
 * Debug mode: on
```

**If you get errors:**
- Make sure you're in the `rakt_radar_backend` directory
- Make sure virtual environment is activated (`venv` should be in your prompt)
- Check that all dependencies are installed: `pip install -r requirements.txt`

## 🎨 **Step 2: Start Frontend Manually**

Open **Terminal 2** and run:

```bash
cd rakt-radar-frontend
pnpm run dev --host
```

**Expected Output:**
```
  VITE v6.3.5  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**If you get errors:**
- Make sure you're in the `rakt-radar-frontend` directory
- Install dependencies: `pnpm install`
- Check that Node.js and pnpm are installed

## 🧪 **Step 3: Test Backend API**

Open **Terminal 3** and test the backend:

```bash
# Test if backend is responding
curl http://localhost:8000/api/hospitals

# Test if demo users were created
curl http://localhost:8000/api/auth/login
```

**Expected Results:**
- First command should return JSON data of hospitals
- Second command should return "Method Not Allowed" (which is correct for GET)

## 🌐 **Step 4: Test Frontend**

1. Open your browser
2. Go to `http://localhost:5173`
3. You should see the login page
4. Try logging in with demo credentials

## 🔑 **Demo Credentials**

| Role | Username | Password |
|------|----------|----------|
| **Hospital** | `apollo_hospital` | `hospital123` |
| **Blood Bank** | `chennai_blood_bank` | `bank123` |
| **Driver** | `demo_driver` | `driver123` |
| **Admin** | `admin` | `admin123` |

## 🚨 **Common Issues & Solutions**

### **Issue 1: "No module named 'src'"**
**Solution:**
```bash
cd rakt_radar_backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python src/main.py
```

### **Issue 2: Database errors**
**Solution:**
```bash
cd rakt_radar_backend
rm -f rakt_radar.db
python src/main.py
```

### **Issue 3: Port already in use**
**Solution:**
```bash
# Find what's using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
```

### **Issue 4: Frontend can't connect to backend**
**Solution:**
- Check that backend is running on port 8000
- Check that frontend is running on port 5173
- Verify API calls in browser DevTools Network tab

## 🎯 **Success Indicators**

✅ **Backend Terminal shows:**
- "Database initialized with demo data"
- "Demo users created successfully"
- "Running on http://0.0.0.0:8000"

✅ **Frontend Terminal shows:**
- "VITE ready in XXX ms"
- "Local: http://localhost:5173/"

✅ **Browser shows:**
- Login page loads
- Can login with demo credentials
- Role-based dashboard appears

## 🚀 **Next Steps After Success**

1. **Test all three roles** (Hospital, Blood Bank, Driver)
2. **Create emergency request** from Hospital
3. **Approve request** from Blood Bank
4. **Manage route** from Driver
5. **Watch real-time sync** across all systems

## 📞 **If Still Having Issues**

1. **Check all terminal outputs** for error messages
2. **Verify file paths** are correct
3. **Check Python version** (should be 3.8+)
4. **Check Node.js version** (should be 16+)
5. **Share specific error messages** for targeted help

---

**Try these steps manually and let me know exactly what happens at each step!** 🚀
