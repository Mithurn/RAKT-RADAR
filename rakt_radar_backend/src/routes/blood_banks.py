from flask import Blueprint, request, jsonify
from src.models.models import BloodBank, db

blood_banks_bp = Blueprint('blood_banks', __name__)

@blood_banks_bp.route('/blood_banks', methods=['GET'])
def get_blood_banks():
    """Get all blood banks"""
    try:
        blood_banks = BloodBank.query.all()
        return jsonify([blood_bank.to_dict() for blood_bank in blood_banks]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blood_banks_bp.route('/blood_banks/<blood_bank_id>', methods=['GET'])
def get_blood_bank(blood_bank_id):
    """Get a specific blood bank"""
    try:
        blood_bank = BloodBank.query.get(blood_bank_id)
        if not blood_bank:
            return jsonify({'error': 'Blood bank not found'}), 404
        return jsonify(blood_bank.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blood_banks_bp.route('/blood_banks', methods=['POST'])
def create_blood_bank():
    """Create a new blood bank"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'address', 'city', 'state', 'latitude', 'longitude', 
                          'contact_person', 'contact_email', 'contact_phone']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        blood_bank = BloodBank(
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
        
        db.session.add(blood_bank)
        db.session.commit()
        
        return jsonify(blood_bank.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@blood_banks_bp.route('/blood_banks/<blood_bank_id>', methods=['PUT'])
def update_blood_bank(blood_bank_id):
    """Update a blood bank"""
    try:
        blood_bank = BloodBank.query.get(blood_bank_id)
        if not blood_bank:
            return jsonify({'error': 'Blood bank not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        updatable_fields = ['name', 'address', 'city', 'state', 'latitude', 'longitude', 
                           'contact_person', 'contact_email', 'contact_phone']
        for field in updatable_fields:
            if field in data:
                if field in ['latitude', 'longitude']:
                    setattr(blood_bank, field, float(data[field]))
                else:
                    setattr(blood_bank, field, data[field])
        
        db.session.commit()
        return jsonify(blood_bank.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@blood_banks_bp.route('/blood_banks/<blood_bank_id>', methods=['DELETE'])
def delete_blood_bank(blood_bank_id):
    """Delete a blood bank"""
    try:
        blood_bank = BloodBank.query.get(blood_bank_id)
        if not blood_bank:
            return jsonify({'error': 'Blood bank not found'}), 404
        
        db.session.delete(blood_bank)
        db.session.commit()
        
        return jsonify({'message': 'Blood bank deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

