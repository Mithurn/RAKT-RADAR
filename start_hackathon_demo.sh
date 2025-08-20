#!/bin/bash

# 🚀 RAKT-RADAR Hackathon Demo Startup Script
# This script starts the system for the 3-laptop demo

echo "🚀 RAKT-RADAR Hackathon Demo System"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "rakt_radar_backend/src/main.py" ]; then
    echo "❌ Error: Please run this script from the rakt_radar_clean directory"
    exit 1
fi

# Function to get local IP address
get_local_ip() {
    if command -v ipconfig &> /dev/null; then
        # macOS
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"
    elif command -v hostname &> /dev/null; then
        # Linux
        hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost"
    else
        echo "localhost"
    fi
}

LOCAL_IP=$(get_local_ip)
echo "📍 Your local IP address: $LOCAL_IP"
echo ""

# Ask user what they want to start
echo "What would you like to start?"
echo "1. Backend Server (Run on Laptop 1 - Backend)"
echo "2. Frontend - Hospital & Blood Bank (Run on Laptop 2)"
echo "3. Frontend - Driver (Run on Laptop 3)"
echo "4. Test Real-time Endpoints"
echo "5. Show Demo Instructions"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Starting Backend Server..."
        echo "📍 Backend will be available at: http://$LOCAL_IP:8000"
        echo "🔌 Other laptops should connect to: http://$LOCAL_IP:8000"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo ""
        
        cd rakt_radar_backend
        source venv/bin/activate
        python src/main.py
        ;;
        
    2)
        echo "🏥 Starting Frontend - Hospital & Blood Bank View..."
        echo "📍 Frontend will be available at: http://$LOCAL_IP:5174"
        echo "🔌 Connect to backend at: http://$LOCAL_IP:8000"
        echo ""
        echo "Press Ctrl+C to stop the frontend"
        echo ""
        
        cd rakt-radar-frontend
        npm install
        npm run dev --host
        ;;
        
    3)
        echo "🚚 Starting Frontend - Driver View..."
        echo "📍 Frontend will be available at: http://$LOCAL_IP:5175"
        echo "🔌 Connect to backend at: http://$LOCAL_IP:8000"
        echo ""
        echo "Press Ctrl+C to stop the frontend"
        echo ""
        
        cd rakt-radar-frontend
        npm install
        npm run dev --host --port 5175
        ;;
        
    4)
        echo "🧪 Testing Real-time Endpoints..."
        echo "📍 Testing backend at: http://$LOCAL_IP:8000"
        echo ""
        
        # Test if backend is running
        if curl -s "http://$LOCAL_IP:8000/api/realtime/status" > /dev/null; then
            echo "✅ Backend is running!"
            echo "📊 System Status:"
            curl -s "http://$LOCAL_IP:8000/api/realtime/status" | python -m json.tool
        else
            echo "❌ Backend is not running. Please start it first (option 1)"
        fi
        ;;
        
    5)
        echo "📚 DEMO INSTRUCTIONS"
        echo "====================="
        echo ""
        echo "🎯 DEMO FLOW:"
        echo "1. Laptop 1: Start Backend Server (option 1)"
        echo "2. Laptop 2: Start Hospital & Blood Bank View (option 2)"
        echo "3. Laptop 3: Start Driver View (option 3)"
        echo ""
        echo "🏥 HOSPITAL DEMO:"
        echo "- Login: admin@apollohospitals.com / hospital123"
        echo "- Create emergency request: B+ blood, 300ml, High urgency"
        echo "- Watch AI find optimal blood bank"
        echo ""
        echo "🩸 BLOOD BANK DEMO:"
        echo "- Login: admin@chennaibloodbank.com / bank123"
        echo "- See emergency request appear instantly"
        echo "- Click 'Approve' to assign driver"
        echo ""
        echo "🚚 DRIVER DEMO:"
        echo "- Login: driver@raktradar.com / driver123"
        echo "- See assigned route with pickup details"
        echo "- Click 'Start Delivery' for live tracking"
        echo ""
        echo "📡 REAL-TIME UPDATES:"
        echo "- All 3 views update every 2-5 seconds"
        echo "- Driver location tracked in real-time"
        echo "- Delivery status synchronized across all views"
        echo ""
        echo "🌐 NETWORK CONFIGURATION:"
        echo "- All laptops must be on same WiFi network"
        echo "- Use IP addresses, not localhost"
        echo "- Backend: $LOCAL_IP:8000"
        echo "- Frontend 1: $LOCAL_IP:5174"
        echo "- Frontend 2: $LOCAL_IP:5175"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
