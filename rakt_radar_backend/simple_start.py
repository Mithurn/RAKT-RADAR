#!/usr/bin/env python3
"""
Simplified startup script for RAKT-RADAR
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# Create Flask app
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///rakt_radar.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS
CORS(app, supports_credentials=True)

# Create database instance
db = SQLAlchemy()
db.init_app(app)

# Define models here to avoid circular imports
class Hospital(db.Model):
    __tablename__ = 'hospitals'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    contact_person = db.Column(db.String(255), nullable=False)
    contact_email = db.Column(db.String(255), nullable=False, unique=True)
    contact_phone = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

class BloodBank(db.Model):
    __tablename__ = 'blood_banks'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    contact_person = db.Column(db.String(255), nullable=False)
    contact_email = db.Column(db.String(255), nullable=False, unique=True)
    contact_phone = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    entity_id = db.Column(db.String(36), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    last_login = db.Column(db.DateTime, nullable=True)

def create_demo_data():
    """Create basic demo data"""
    with app.app_context():
        db.create_all()
        
        # Create demo users if none exist
        if User.query.count() == 0:
            import hashlib
            
            demo_users = [
                {
                    'username': 'apollo_hospital',
                    'email': 'admin@apollohospitals.com',
                    'password': 'hospital123',
                    'role': 'hospital'
                },
                {
                    'username': 'chennai_blood_bank',
                    'email': 'admin@chennaibloodbank.com',
                    'password': 'bank123',
                    'role': 'blood_bank'
                },
                {
                    'username': 'demo_driver',
                    'email': 'driver@raktradar.com',
                    'password': 'driver123',
                    'role': 'driver'
                },
                {
                    'username': 'admin',
                    'email': 'admin@raktradar.com',
                    'password': 'admin123',
                    'role': 'admin'
                }
            ]
            
            for user_data in demo_users:
                user = User(
                    username=user_data['username'],
                    email=user_data['email'],
                    password_hash=hashlib.sha256(user_data['password'].encode()).hexdigest(),
                    role=user_data['role']
                )
                db.session.add(user)
            
            db.session.commit()
            print(f"✅ Created {len(demo_users)} demo users")
        
        # Create demo hospitals if none exist
        if Hospital.query.count() == 0:
            hospitals = [
                {
                    'name': 'Apollo Hospitals Chennai',
                    'address': 'Greams Road, Chennai',
                    'city': 'Chennai',
                    'state': 'Tamil Nadu',
                    'latitude': 13.0827,
                    'longitude': 80.2707,
                    'contact_person': 'Dr. John Doe',
                    'contact_email': 'admin@apollohospitals.com',
                    'contact_phone': '+91-44-2829-0200'
                }
            ]
            
            for hospital_data in hospitals:
                hospital = Hospital(**hospital_data)
                db.session.add(hospital)
            
            db.session.commit()
            print(f"✅ Created {len(hospitals)} demo hospitals")
        
        # Create demo blood banks if none exist
        if BloodBank.query.count() == 0:
            blood_banks = [
                {
                    'name': 'Chennai Central Blood Bank',
                    'address': 'Anna Salai, Chennai',
                    'city': 'Chennai',
                    'state': 'Tamil Nadu',
                    'latitude': 13.0827,
                    'longitude': 80.2707,
                    'contact_person': 'Dr. Jane Smith',
                    'contact_email': 'admin@chennaibloodbank.com',
                    'contact_phone': '+91-44-2829-0300'
                }
            ]
            
            for bank_data in blood_banks:
                bank = BloodBank(**bank_data)
                db.session.add(bank)
            
            db.session.commit()
            print(f"✅ Created {len(blood_banks)} demo blood banks")

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'message': 'RAKT-RADAR is running!'}

@app.route('/api/hospitals')
def get_hospitals():
    """Get all hospitals"""
    with app.app_context():
        hospitals = Hospital.query.all()
        return [{'id': h.id, 'name': h.name, 'city': h.city} for h in hospitals]

if __name__ == '__main__':
    print("🚀 Starting RAKT-RADAR (Simplified)...")
    
    # Create demo data
    create_demo_data()
    
    print("🌐 Starting Flask server on http://localhost:8000")
    print("🔑 Demo users created successfully")
    print("📊 Database initialized with demo data")
    
    app.run(host='0.0.0.0', port=8000, debug=True)
