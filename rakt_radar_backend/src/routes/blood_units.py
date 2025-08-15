from flask import Blueprint, request, jsonify
from datetime import datetime, date
from src.models.models import BloodUnit, BloodBank, db

blood_units_bp = Blueprint('blood_units', __name__)

@blood_units_bp.route('/blood_units', methods=['GET'])
def get_blood_units():
    """Get all blood units with optional filters"""
    try:
        query = BloodUnit.query
        
        # Apply filters if provided
        status = request.args.get('status')
        blood_type = request.args.get('blood_type')
        is_flagged = request.args.get('is_flagged_for_expiry')
        blood_bank_id = request.args.get('blood_bank_id')
        
        if status:
            query = query.filter(BloodUnit.status == status)
        if blood_type:
            query = query.filter(BloodUnit.blood_type == blood_type)
        if is_flagged is not None:
            is_flagged_bool = is_flagged.lower() == 'true'
            query = query.filter(BloodUnit.is_flagged_for_expiry == is_flagged_bool)
        if blood_bank_id:
            query = query.filter(BloodUnit.blood_bank_id == blood_bank_id)
        
        blood_units = query.all()
        
        # Add additional info to each blood unit
        result = []
        for unit in blood_units:
            unit_dict = unit.to_dict()
            unit_dict['days_until_expiry'] = unit.days_until_expiry()
            
            # Add blood bank info
            blood_bank = BloodBank.query.get(unit.blood_bank_id)
            if blood_bank:
                unit_dict['blood_bank_name'] = blood_bank.name
                unit_dict['blood_bank_city'] = blood_bank.city
            
            result.append(unit_dict)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blood_units_bp.route('/blood_units/<blood_unit_id>', methods=['GET'])
def get_blood_unit(blood_unit_id):
    """Get a specific blood unit"""
    try:
        blood_unit = BloodUnit.query.get(blood_unit_id)
        if not blood_unit:
            return jsonify({'error': 'Blood unit not found'}), 404
        
        unit_dict = blood_unit.to_dict()
        unit_dict['days_until_expiry'] = blood_unit.days_until_expiry()
        
        # Add blood bank info
        blood_bank = BloodBank.query.get(blood_unit.blood_bank_id)
        if blood_bank:
            unit_dict['blood_bank_name'] = blood_bank.name
            unit_dict['blood_bank_city'] = blood_bank.city
        
        return jsonify(unit_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blood_units_bp.route('/blood_units', methods=['POST'])
def create_blood_unit():
    """Create a new blood unit"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['blood_bank_id', 'blood_type', 'quantity_ml', 'collection_date', 
                          'expiry_date', 'current_location_latitude', 'current_location_longitude']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate blood bank exists
        blood_bank = BloodBank.query.get(data['blood_bank_id'])
        if not blood_bank:
            return jsonify({'error': 'Blood bank not found'}), 404
        
        # Parse dates
        collection_date = datetime.strptime(data['collection_date'], '%Y-%m-%d').date()
        expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        
        # Check if should be flagged for expiry
        days_until_expiry = (expiry_date - date.today()).days
        is_flagged = days_until_expiry <= 7 and days_until_expiry > 0
        
        blood_unit = BloodUnit(
            blood_bank_id=data['blood_bank_id'],
            blood_type=data['blood_type'],
            quantity_ml=int(data['quantity_ml']),
            collection_date=collection_date,
            expiry_date=expiry_date,
            status=data.get('status', 'available'),
            is_flagged_for_expiry=is_flagged,
            current_location_latitude=float(data['current_location_latitude']),
            current_location_longitude=float(data['current_location_longitude'])
        )
        
        db.session.add(blood_unit)
        db.session.commit()
        
        unit_dict = blood_unit.to_dict()
        unit_dict['days_until_expiry'] = blood_unit.days_until_expiry()
        
        return jsonify(unit_dict), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@blood_units_bp.route('/blood_units/<blood_unit_id>', methods=['PUT'])
def update_blood_unit(blood_unit_id):
    """Update a blood unit"""
    try:
        blood_unit = BloodUnit.query.get(blood_unit_id)
        if not blood_unit:
            return jsonify({'error': 'Blood unit not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'blood_type' in data:
            blood_unit.blood_type = data['blood_type']
        if 'quantity_ml' in data:
            blood_unit.quantity_ml = int(data['quantity_ml'])
        if 'status' in data:
            blood_unit.status = data['status']
        if 'current_location_latitude' in data:
            blood_unit.current_location_latitude = float(data['current_location_latitude'])
        if 'current_location_longitude' in data:
            blood_unit.current_location_longitude = float(data['current_location_longitude'])
        
        # Update dates if provided
        if 'collection_date' in data:
            blood_unit.collection_date = datetime.strptime(data['collection_date'], '%Y-%m-%d').date()
        if 'expiry_date' in data:
            blood_unit.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            # Recalculate flagged status
            days_until_expiry = (blood_unit.expiry_date - date.today()).days
            blood_unit.is_flagged_for_expiry = days_until_expiry <= 7 and days_until_expiry > 0
        
        db.session.commit()
        
        unit_dict = blood_unit.to_dict()
        unit_dict['days_until_expiry'] = blood_unit.days_until_expiry()
        
        return jsonify(unit_dict), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@blood_units_bp.route('/blood_units/<blood_unit_id>', methods=['DELETE'])
def delete_blood_unit(blood_unit_id):
    """Delete a blood unit"""
    try:
        blood_unit = BloodUnit.query.get(blood_unit_id)
        if not blood_unit:
            return jsonify({'error': 'Blood unit not found'}), 404
        
        db.session.delete(blood_unit)
        db.session.commit()
        
        return jsonify({'message': 'Blood unit deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@blood_units_bp.route('/blood_units/flagged_for_expiry', methods=['GET'])
def get_flagged_blood_units():
    """Get blood units flagged for expiry"""
    try:
        blood_units = BloodUnit.query.filter(BloodUnit.is_flagged_for_expiry == True).all()
        
        result = []
        for unit in blood_units:
            unit_dict = unit.to_dict()
            unit_dict['days_until_expiry'] = unit.days_until_expiry()
            
            # Add blood bank info
            blood_bank = BloodBank.query.get(unit.blood_bank_id)
            if blood_bank:
                unit_dict['blood_bank_name'] = blood_bank.name
                unit_dict['blood_bank_city'] = blood_bank.city
            
            result.append(unit_dict)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

