from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.models import Transfer, BloodUnit, Hospital, BloodBank, db

transfers_bp = Blueprint('transfers', __name__)

@transfers_bp.route('/transfers', methods=['GET'])
def get_transfers():
    """Get all transfers"""
    try:
        transfers = Transfer.query.all()
        
        result = []
        for transfer in transfers:
            transfer_dict = transfer.to_dict()
            
            # Add blood unit info
            blood_unit = BloodUnit.query.get(transfer.blood_unit_id)
            if blood_unit:
                transfer_dict['blood_unit'] = {
                    'blood_type': blood_unit.blood_type,
                    'quantity_ml': blood_unit.quantity_ml,
                    'expiry_date': blood_unit.expiry_date.isoformat() if blood_unit.expiry_date else None
                }
            
            # Add entity names (try both hospital and blood bank)
            from_entity = Hospital.query.get(transfer.from_entity_id) or BloodBank.query.get(transfer.from_entity_id)
            to_entity = Hospital.query.get(transfer.to_entity_id) or BloodBank.query.get(transfer.to_entity_id)
            
            if from_entity:
                transfer_dict['from_entity_name'] = from_entity.name
                transfer_dict['from_entity_type'] = 'hospital' if isinstance(from_entity, Hospital) else 'blood_bank'
            
            if to_entity:
                transfer_dict['to_entity_name'] = to_entity.name
                transfer_dict['to_entity_type'] = 'hospital' if isinstance(to_entity, Hospital) else 'blood_bank'
            
            result.append(transfer_dict)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transfers_bp.route('/transfers/<transfer_id>', methods=['GET'])
def get_transfer(transfer_id):
    """Get a specific transfer"""
    try:
        transfer = Transfer.query.get(transfer_id)
        if not transfer:
            return jsonify({'error': 'Transfer not found'}), 404
        
        transfer_dict = transfer.to_dict()
        
        # Add blood unit info
        blood_unit = BloodUnit.query.get(transfer.blood_unit_id)
        if blood_unit:
            transfer_dict['blood_unit'] = {
                'blood_type': blood_unit.blood_type,
                'quantity_ml': blood_unit.quantity_ml,
                'expiry_date': blood_unit.expiry_date.isoformat() if blood_unit.expiry_date else None
            }
        
        # Add entity names
        from_entity = Hospital.query.get(transfer.from_entity_id) or BloodBank.query.get(transfer.from_entity_id)
        to_entity = Hospital.query.get(transfer.to_entity_id) or BloodBank.query.get(transfer.to_entity_id)
        
        if from_entity:
            transfer_dict['from_entity_name'] = from_entity.name
            transfer_dict['from_entity_type'] = 'hospital' if isinstance(from_entity, Hospital) else 'blood_bank'
        
        if to_entity:
            transfer_dict['to_entity_name'] = to_entity.name
            transfer_dict['to_entity_type'] = 'hospital' if isinstance(to_entity, Hospital) else 'blood_bank'
        
        return jsonify(transfer_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transfers_bp.route('/transfers', methods=['POST'])
def create_transfer():
    """Create a new transfer"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['blood_unit_id', 'from_entity_id', 'to_entity_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate blood unit exists
        blood_unit = BloodUnit.query.get(data['blood_unit_id'])
        if not blood_unit:
            return jsonify({'error': 'Blood unit not found'}), 404
        
        # Validate entities exist
        from_entity = Hospital.query.get(data['from_entity_id']) or BloodBank.query.get(data['from_entity_id'])
        to_entity = Hospital.query.get(data['to_entity_id']) or BloodBank.query.get(data['to_entity_id'])
        
        if not from_entity:
            return jsonify({'error': 'From entity not found'}), 404
        if not to_entity:
            return jsonify({'error': 'To entity not found'}), 404
        
        # Parse transfer date if provided
        transfer_date = datetime.utcnow()
        if 'transfer_date' in data:
            transfer_date = datetime.fromisoformat(data['transfer_date'].replace('Z', '+00:00'))
        
        transfer = Transfer(
            blood_unit_id=data['blood_unit_id'],
            from_entity_id=data['from_entity_id'],
            to_entity_id=data['to_entity_id'],
            transfer_date=transfer_date,
            status=data.get('status', 'pending'),
            notes=data.get('notes', '')
        )
        
        db.session.add(transfer)
        
        # Update blood unit status if transfer is completed
        if transfer.status == 'completed':
            blood_unit.status = 'transferred'
            # Update location to destination
            blood_unit.current_location_latitude = to_entity.latitude
            blood_unit.current_location_longitude = to_entity.longitude
        
        db.session.commit()
        
        return jsonify(transfer.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@transfers_bp.route('/transfers/<transfer_id>', methods=['PUT'])
def update_transfer(transfer_id):
    """Update a transfer"""
    try:
        transfer = Transfer.query.get(transfer_id)
        if not transfer:
            return jsonify({'error': 'Transfer not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'status' in data:
            old_status = transfer.status
            transfer.status = data['status']
            
            # Update blood unit status if transfer status changed
            blood_unit = BloodUnit.query.get(transfer.blood_unit_id)
            if blood_unit:
                if data['status'] == 'completed' and old_status != 'completed':
                    blood_unit.status = 'transferred'
                    # Update location to destination
                    to_entity = Hospital.query.get(transfer.to_entity_id) or BloodBank.query.get(transfer.to_entity_id)
                    if to_entity:
                        blood_unit.current_location_latitude = to_entity.latitude
                        blood_unit.current_location_longitude = to_entity.longitude
                elif data['status'] == 'cancelled':
                    blood_unit.status = 'available'
        
        if 'notes' in data:
            transfer.notes = data['notes']
        
        if 'transfer_date' in data:
            transfer.transfer_date = datetime.fromisoformat(data['transfer_date'].replace('Z', '+00:00'))
        
        db.session.commit()
        return jsonify(transfer.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@transfers_bp.route('/transfers/<transfer_id>', methods=['DELETE'])
def delete_transfer(transfer_id):
    """Delete a transfer"""
    try:
        transfer = Transfer.query.get(transfer_id)
        if not transfer:
            return jsonify({'error': 'Transfer not found'}), 404
        
        # Reset blood unit status if transfer was completed
        if transfer.status == 'completed':
            blood_unit = BloodUnit.query.get(transfer.blood_unit_id)
            if blood_unit:
                blood_unit.status = 'available'
        
        db.session.delete(transfer)
        db.session.commit()
        
        return jsonify({'message': 'Transfer deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

