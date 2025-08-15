from flask_sqlalchemy import SQLAlchemy
import uuid
from datetime import datetime, date

db = SQLAlchemy()

class BloodUnit(db.Model):
    __tablename__ = 'blood_units'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blood_bank_id = db.Column(db.String(36), db.ForeignKey('blood_banks.id'), nullable=False)
    blood_type = db.Column(db.String(10), nullable=False)  # e.g., 'A+', 'O-', 'AB+'
    quantity_ml = db.Column(db.Integer, nullable=False)
    collection_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='available')  # available, transferred, expired
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
            delta = self.expiry_date - today
            return delta.days
        return None

