from flask_sqlalchemy import SQLAlchemy
import uuid
from datetime import datetime, date

db = SQLAlchemy()

class Hospital(db.Model):
    __tablename__ = 'hospitals'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False, unique=True)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    contact_person = db.Column(db.String(255), nullable=False)
    contact_email = db.Column(db.String(255), nullable=False, unique=True)
    contact_phone = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'contact_person': self.contact_person,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BloodBank(db.Model):
    __tablename__ = 'blood_banks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False, unique=True)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    contact_person = db.Column(db.String(255), nullable=False)
    contact_email = db.Column(db.String(255), nullable=False, unique=True)
    contact_phone = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'contact_person': self.contact_person,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BloodUnit(db.Model):
    __tablename__ = 'blood_units'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blood_bank_id = db.Column(db.String(36), db.ForeignKey('blood_banks.id'), nullable=False)
    blood_type = db.Column(db.String(10), nullable=False)  # e.g., 'A+', 'O-', 'AB+'
    quantity_ml = db.Column(db.Integer, nullable=False)
    collection_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='available')  # available, reserved, dispatched, used, expired
    is_flagged_for_expiry = db.Column(db.Boolean, nullable=False, default=False)
    current_location_latitude = db.Column(db.Float, nullable=False)
    current_location_longitude = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'blood_bank_id': self.blood_bank_id,
            'blood_type': self.blood_type,
            'quantity_ml': self.quantity_ml,
            'collection_date': self.collection_date.isoformat() if self.collection_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'status': self.status,
            'is_flagged_for_expiry': self.is_flagged_for_expiry,
            'current_location_latitude': self.current_location_latitude,
            'current_location_longitude': self.current_location_longitude,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def days_until_expiry(self):
        """Calculate days until expiry from today"""
        if self.expiry_date:
            today = date.today()
            return (self.expiry_date - today).days
        return None

class Transfer(db.Model):
    __tablename__ = 'transfers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blood_unit_id = db.Column(db.String(36), db.ForeignKey('blood_units.id'), nullable=False)
    from_entity_id = db.Column(db.String(36), nullable=False)  # ID of the entity transferring the blood
    to_entity_id = db.Column(db.String(36), nullable=False)    # ID of the entity receiving the blood
    transfer_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, completed, cancelled
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'blood_unit_id': self.blood_unit_id,
            'from_entity_id': self.from_entity_id,
            'to_entity_id': self.to_entity_id,
            'transfer_date': self.transfer_date.isoformat() if self.transfer_date else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# New models for the 3-POV demo system

class EmergencyRequest(db.Model):
    __tablename__ = 'emergency_requests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = db.Column(db.String(36), db.ForeignKey('hospitals.id'), nullable=False)
    blood_type = db.Column(db.String(10), nullable=False)
    quantity_ml = db.Column(db.Integer, nullable=False)
    urgency = db.Column(db.String(20), nullable=False, default='high')  # low, medium, high, critical
    status = db.Column(db.String(20), nullable=False, default='created')  # created, approved, en_route, delivered, cancelled
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # ML suggestions
    suggested_bank_id = db.Column(db.String(36), db.ForeignKey('blood_banks.id'), nullable=True)
    ml_confidence_score = db.Column(db.Float, nullable=True)
    predicted_eta_minutes = db.Column(db.Integer, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'hospital_id': self.hospital_id,
            'blood_type': self.blood_type,
            'quantity_ml': self.quantity_ml,
            'urgency': self.urgency,
            'status': self.status,
            'notes': self.notes,
            'suggested_bank_id': self.suggested_bank_id,
            'ml_confidence_score': self.ml_confidence_score,
            'predicted_eta_minutes': self.predicted_eta_minutes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class RequestItem(db.Model):
    __tablename__ = 'request_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String(36), db.ForeignKey('emergency_requests.id'), nullable=False)
    unit_id = db.Column(db.String(36), db.ForeignKey('blood_units.id'), nullable=False)
    source_bank_id = db.Column(db.String(36), db.ForeignKey('blood_banks.id'), nullable=False)
    quantity_ml = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'unit_id': self.unit_id,
            'source_bank_id': self.source_bank_id,
            'quantity_ml': self.quantity_ml,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Route(db.Model):
    __tablename__ = 'routes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String(36), db.ForeignKey('emergency_requests.id'), nullable=False)
    driver_name = db.Column(db.String(255), nullable=False)
    start_latitude = db.Column(db.Float, nullable=False)
    start_longitude = db.Column(db.Float, nullable=False)
    end_latitude = db.Column(db.Float, nullable=False)
    end_longitude = db.Column(db.Float, nullable=False)
    eta_minutes = db.Column(db.Integer, nullable=False)
    distance_km = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, active, completed
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'driver_name': self.driver_name,
            'start_latitude': self.start_latitude,
            'start_longitude': self.start_longitude,
            'end_latitude': self.end_latitude,
            'end_longitude': self.end_longitude,
            'eta_minutes': self.eta_minutes,
            'distance_km': self.distance_km,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TrackPoint(db.Model):
    __tablename__ = 'track_points'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    route_id = db.Column(db.String(36), db.ForeignKey('routes.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'route_id': self.route_id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Driver(db.Model):
    __tablename__ = 'drivers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    vehicle_number = db.Column(db.String(20), nullable=False)
    current_latitude = db.Column(db.Float, nullable=True)
    current_longitude = db.Column(db.Float, nullable=True)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'vehicle_number': self.vehicle_number,
            'current_latitude': self.current_latitude,
            'current_longitude': self.current_longitude,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

