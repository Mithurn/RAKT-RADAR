from flask import Blueprint, request, jsonify
from src.models.models import Hospital, db

hospitals_bp = Blueprint('hospitals', __name__)

@hospitals_bp.route('/hospitals', methods=['GET'])
def get_hospitals():
    """Get all hospitals"""
    try:
        hospitals = Hospital.query.all()
        return jsonify([hospital.to_dict() for hospital in hospitals]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hospitals_bp.route('/hospitals/<hospital_id>', methods=['GET'])
def get_hospital(hospital_id):
    """Get a specific hospital"""
    try:
        hospital = Hospital.query.get(hospital_id)
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404
        return jsonify(hospital.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hospitals_bp.route('/hospitals', methods=['POST'])
def create_hospital():
    """Create a new hospital"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'address', 'city', 'state', 'latitude', 'longitude', 
                          'contact_person', 'contact_email', 'contact_phone']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        hospital = Hospital(
            name=data['name'],
            address=data['address'],
            city=data['city'],
            state=data['state'],
            latitude=float(data['latitude']),
            longitude=float(data['longitude']),
            contact_person=data['contact_person'],
            contact_email=data['contact_email'],
            contact_phone=data['contact_phone']
        )
        
        db.session.add(hospital)
        db.session.commit()
        
        return jsonify(hospital.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hospitals_bp.route('/hospitals/<hospital_id>', methods=['PUT'])
def update_hospital(hospital_id):
    """Update a hospital"""
    try:
        hospital = Hospital.query.get(hospital_id)
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        updatable_fields = ['name', 'address', 'city', 'state', 'latitude', 'longitude', 
                           'contact_person', 'contact_email', 'contact_phone']
        for field in updatable_fields:
            if field in data:
                if field in ['latitude', 'longitude']:
                    setattr(hospital, field, float(data[field]))
                else:
                    setattr(hospital, field, data[field])
        
        db.session.commit()
        return jsonify(hospital.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hospitals_bp.route('/hospitals/<hospital_id>', methods=['DELETE'])
def delete_hospital(hospital_id):
    """Delete a hospital"""
    try:
        hospital = Hospital.query.get(hospital_id)
        if not hospital:
            return jsonify({'error': 'Hospital not found'}), 404
        
        db.session.delete(hospital)
        db.session.commit()
        
        return jsonify({'message': 'Hospital deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

