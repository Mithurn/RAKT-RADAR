# RAKT-RADAR MVP Deployment Guide

## Overview

RAKT-RADAR is a revolutionary blood bank management system with operational intelligence features designed to prevent blood wastage and save lives through AI-powered smart redistribution. This guide provides complete instructions for deploying and running the MVP on your local system.

## System Architecture

The RAKT-RADAR MVP consists of two main components:

1. **Backend (Flask API)**: Located in `rakt_radar_backend/`
   - Python Flask application with RESTful API
   - SQLite database for data persistence
   - Mock AI intelligence features
   - CORS enabled for frontend integration

2. **Frontend (React Dashboard)**: Located in `rakt-radar-frontend/`
   - Modern React.js application with Tailwind CSS
   - Interactive dashboard with real-time data
   - Professional UI/UX design
   - Responsive layout for all devices

## Prerequisites

Before deploying RAKT-RADAR, ensure your system has the following installed:

### Required Software
- **Python 3.11+** (for backend)
- **Node.js 20+** (for frontend)
- **pnpm** (package manager, comes with Node.js)
- **Git** (for version control)

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: At least 2GB free space
- **Network**: Internet connection for initial setup

## Installation Instructions

### Step 1: Backend Setup (Flask API)

1. **Navigate to the backend directory:**
   ```bash
   cd rakt_radar_backend
   ```

2. **Create and activate Python virtual environment:**
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate
   
   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Flask backend server:**
   ```bash
   python src/main.py
   ```

   The backend will start on `http://localhost:5000` and automatically:
   - Create the SQLite database
   - Generate mock data (10 hospitals, 8 blood banks, 50 blood units)
   - Enable CORS for frontend communication

### Step 2: Frontend Setup (React Dashboard)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd rakt-radar-frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the React development server:**
   ```bash
   pnpm run dev --host
   ```

   The frontend will start on `http://localhost:5173`

### Step 3: Access the Application

1. **Open your web browser** and navigate to `http://localhost:5173`
2. **The RAKT-RADAR dashboard** will load with live data from the backend
3. **Explore all features** through the four main tabs:
   - **Overview**: Key metrics and blood type distribution
   - **Inventory**: Units nearing expiry with alerts
   - **Intelligence**: AI-powered demand matching
   - **Network**: Hospitals and blood banks listing

## Features Demonstration

### Core Functionalities

1. **Centralized Registry**
   - View all hospitals and blood banks in the Network tab
   - Real-time inventory tracking across all entities

2. **Expiry Prediction**
   - Check the Inventory tab for units flagged as nearing expiry
   - Automatic flagging of units within 7 days of expiration

3. **Demand Matching**
   - Visit the Intelligence tab to see AI-powered matches
   - Urgency levels (critical, high, medium, low) for prioritization

4. **System Analytics**
   - Overview tab shows key performance indicators
   - Efficiency metrics including wastage prevention rate
   - Blood type distribution with interactive charts

### API Testing

You can test the backend API directly using curl commands:

1. **Get all hospitals:**
   ```bash
   curl http://localhost:5000/api/hospitals
   ```

2. **Get flagged blood units:**
   ```bash
   curl http://localhost:5000/api/blood_units/flagged_for_expiry
   ```

3. **Get dashboard analytics:**
   ```bash
   curl http://localhost:5000/api/analytics/dashboard
   ```

4. **Create a new blood unit:**
   ```bash
   curl -X POST http://localhost:5000/api/blood_units \
     -H "Content-Type: application/json" \
     -d '{
       "blood_bank_id": "your-blood-bank-id",
       "blood_type": "A+",
       "quantity_ml": 450,
       "collection_date": "2025-08-15",
       "expiry_date": "2025-09-20",
       "current_location_latitude": 22.5726,
       "current_location_longitude": 88.3639
     }'
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Backend won't start:**
   - Ensure Python 3.11+ is installed
   - Check that virtual environment is activated
   - Verify all dependencies are installed: `pip install -r requirements.txt`

2. **Frontend won't start:**
   - Ensure Node.js 20+ is installed
   - Try deleting `node_modules` and running `pnpm install` again
   - Check if port 5173 is available

3. **Frontend can't connect to backend:**
   - Ensure backend is running on port 5000
   - Check that CORS is enabled (it should be by default)
   - Verify no firewall is blocking the connection

4. **Database issues:**
   - Delete `src/database/app.db` to reset the database
   - Restart the backend to regenerate mock data

### Port Configuration

If you need to change the default ports:

- **Backend (Flask)**: Edit `src/main.py` and change the port in `app.run(host='0.0.0.0', port=5000)`
- **Frontend (React)**: The frontend is configured to connect to `http://localhost:5000/api`. If you change the backend port, update the `API_BASE` constant in `src/components/Dashboard.jsx`

## System Performance

### Expected Performance Metrics
- **Backend Response Time**: < 100ms for most API endpoints
- **Frontend Load Time**: < 2 seconds on modern browsers
- **Database Operations**: All CRUD operations complete within milliseconds
- **Mock Data Generation**: Completes in under 5 seconds on first startup

### Resource Usage
- **Backend Memory**: ~50-100MB
- **Frontend Memory**: ~100-200MB in browser
- **Database Size**: ~1-5MB with mock data
- **CPU Usage**: Minimal during normal operation

## Development Notes

### Technology Stack
- **Backend**: Python 3.11, Flask, SQLAlchemy, SQLite
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Database**: SQLite (for MVP simplicity)
- **API**: RESTful with JSON responses
- **Authentication**: Not implemented in MVP (would be added in production)

### Mock Intelligence Features
The MVP includes mocked versions of the AI features:
- **Expiry Prediction**: Rule-based flagging (7 days before expiry)
- **Demand Matching**: Random scoring with distance calculations
- **Routing**: Haversine formula for distance, mock time estimates

### Future Enhancements
For production deployment, consider:
- PostgreSQL database for better scalability
- Redis for caching and real-time features
- JWT authentication and authorization
- Docker containerization
- Cloud deployment (AWS, Azure, GCP)
- Real AI/ML models for prediction and matching
- Integration with actual mapping services (Google Maps API)

## Support and Maintenance

### Stopping the Application
1. **Stop Frontend**: Press `Ctrl+C` in the frontend terminal
2. **Stop Backend**: Press `Ctrl+C` in the backend terminal
3. **Deactivate Python Environment**: Run `deactivate` in the backend terminal

### Data Persistence
- The SQLite database persists data between restarts
- To reset data, delete `rakt_radar_backend/src/database/app.db` and restart the backend

### Logs and Debugging
- Backend logs appear in the terminal where Flask is running
- Frontend logs appear in the browser developer console
- Enable Flask debug mode by setting `debug=True` in `src/main.py`

## Conclusion

RAKT-RADAR MVP successfully demonstrates a complete blood bank management workflow with operational intelligence features. The system is ready for demonstration and can be easily extended for production use with additional features and scalability improvements.

For any issues or questions during deployment, refer to the troubleshooting section or check the system logs for detailed error messages.

