from flask_sqlalchemy import SQLAlchemy
import uuid
from datetime import datetime

db = SQLAlchemy()

class Transfer(db.Model):
    __tablename__ = 'transfers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blood_unit_id = db.Column(db.String(36), db.ForeignKey('blood_units.id'), nullable=False)
    from_entity_id = db.Column(db.String(36), nullable=False)  # Can be hospital or blood bank ID
    to_entity_id = db.Column(db.String(36), nullable=False)    # Can be hospital or blood bank ID
    transfer_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
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

