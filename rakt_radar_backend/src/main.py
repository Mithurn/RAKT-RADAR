import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import threading
import time
from datetime import datetime

# Create Flask app first
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes - CRITICAL for multi-laptop demo
CORS(app, supports_credentials=True, origins=["*"])

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///rakt_radar.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
from src.models.models import db
db.init_app(app)

# Global state for real-time updates
real_time_updates = {
    'emergency_requests': [],
    'driver_locations': {},
    'delivery_status': {},
    'last_update': datetime.now().isoformat()
}

# Real-time update endpoints for hackathon demo
@app.route('/api/realtime/emergency-requests', methods=['GET'])
def get_realtime_emergency_requests():
    """Real-time endpoint for emergency requests - works across all laptops"""
    try:
        from src.models.models import EmergencyRequest, Hospital, BloodBank
        from src.models.user import User
        
        # Get all emergency requests with full details
        requests = EmergencyRequest.query.all()
        requests_data = []
        
        for req in requests:
            req_dict = req.to_dict()
            
            # Get hospital details
            hospital = Hospital.query.get(req.hospital_id)
            if hospital:
                req_dict['hospital'] = hospital.to_dict()
            
            # Get suggested bank details
            if req.suggested_bank_id:
                bank = BloodBank.query.get(req.suggested_bank_id)
                if bank:
                    req_dict['suggested_bank'] = bank.to_dict()
            
            requests_data.append(req_dict)
        
        return jsonify({
            'success': True,
            'data': requests_data,
            'timestamp': datetime.now().isoformat(),
            'total_requests': len(requests_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/realtime/driver-updates', methods=['GET'])
def get_realtime_driver_updates():
    """Real-time endpoint for driver location and status updates"""
    try:
        from src.models.models import Route, Driver
        
        # Get all active routes with driver info
        routes = Route.query.filter_by(status='active').all()
        driver_updates = []
        
        for route in routes:
            driver = Driver.query.get(route.driver_id) if route.driver_id else None
            if driver:
                driver_updates.append({
                    'route_id': route.id,
                    'driver_id': driver.id,
                    'driver_name': driver.name,
                    'vehicle_number': driver.vehicle_number,
                    'current_latitude': route.current_latitude or 13.0827,
                    'current_longitude': route.current_longitude or 80.2707,
                    'status': route.status,
                    'eta_minutes': route.eta_minutes or 30,
                    'last_updated': datetime.now().isoformat()
                })
        
        return jsonify({
            'success': True,
            'data': driver_updates,
            'timestamp': datetime.now().isoformat(),
            'total_drivers': len(driver_updates)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/realtime/status', methods=['GET'])
def get_realtime_status():
    """Overall system status for demo monitoring"""
    try:
        from src.models.models import EmergencyRequest, Route, BloodUnit
        
        total_requests = EmergencyRequest.query.count()
        pending_requests = EmergencyRequest.query.filter_by(status='pending_approval').count()
        active_routes = Route.query.filter_by(status='active').count()
        available_blood_units = BloodUnit.query.filter_by(status='available').count()
        
        return jsonify({
            'success': True,
            'system_status': {
                'total_emergency_requests': total_requests,
                'pending_approvals': pending_requests,
                'active_deliveries': active_routes,
                'available_blood_units': available_blood_units,
                'system_health': 'operational',
                'last_update': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Register blueprints
from src.routes.hospitals import hospitals_bp
from src.routes.blood_banks import blood_banks_bp
from src.routes.blood_units import blood_units_bp
from src.routes.transfers import transfers_bp
from src.routes.intelligence import intelligence_bp
from src.routes.user import user_bp
from src.routes.emergency_requests import emergency_requests_bp
from src.routes.routes import routes_bp

app.register_blueprint(hospitals_bp, url_prefix='/api')
app.register_blueprint(blood_banks_bp, url_prefix='/api')
app.register_blueprint(blood_units_bp, url_prefix='/api')
app.register_blueprint(transfers_bp, url_prefix='/api')
app.register_blueprint(intelligence_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(emergency_requests_bp, url_prefix='/api')
app.register_blueprint(routes_bp, url_prefix='/api')

def initialize_database():
    """Initialize database and seed demo data"""
    with app.app_context():
        db.create_all()
        
        # Check if we need to populate mock data
        from src.models.models import Hospital
        if Hospital.query.count() == 0:
            from src.mock_data import populate_mock_data
            populate_mock_data()
        
        # Check if we need to seed demo users
        from src.models.user import User
        if User.query.count() == 0:
            from src.demo_seed import seed_demo_users, seed_demo_blood_units
            seed_demo_users()
            seed_demo_blood_units()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Skip API routes - let them be handled by blueprints
    if path.startswith('api/'):
        return "API endpoint not found", 404
        
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    # Initialize database before starting the server
    initialize_database()
    
    print("🚀 RAKT-RADAR 3-POV Demo System starting...")
    print("📊 Database initialized with demo data")
    print("🔑 Demo users created successfully")
    print("🌐 Starting Flask server on http://localhost:8000")
    print("📡 Real-time endpoints available:")
    print("   - /api/realtime/emergency-requests")
    print("   - /api/realtime/driver-updates")
    print("   - /api/realtime/status")
    print("🔌 CORS enabled for multi-laptop demo")
    
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
