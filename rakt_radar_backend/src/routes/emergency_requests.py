from flask import Blueprint, request, jsonify, session
import math
import random
from datetime import datetime, timedelta
from src.models.models import EmergencyRequest, RequestItem, Route, TrackPoint, BloodUnit, Hospital, BloodBank, Driver, db

emergency_requests_bp = Blueprint('emergency_requests', __name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def ml_predict_bank(hospital_id, blood_type, quantity_ml, urgency):
    """ML service integration for bank matching (mocked for demo)"""
    try:
        # Get hospital location
        hospital = Hospital.query.get(hospital_id)
        if not hospital:
            return None, 0.0
        
        # Get all blood banks with available units
        blood_banks = BloodBank.query.all()
        best_match = None
        best_score = 0.0
        
        for bank in blood_banks:
            # Check if bank has required blood type and quantity
            available_units = BloodUnit.query.filter_by(
                blood_bank_id=bank.id,
                blood_type=blood_type,
                status='available'
            ).all()
            
            total_available = sum(unit.quantity_ml for unit in available_units)
            
            if total_available >= quantity_ml:
                # Calculate distance
                distance = calculate_distance(
                    hospital.latitude, hospital.longitude,
                    bank.latitude, bank.longitude
                )
                
                # Mock ML scoring algorithm
                # Factors: distance, urgency, availability, expiry risk
                distance_score = max(0, 100 - (distance * 2))  # Closer = better
                urgency_multiplier = {'low': 1.0, 'medium': 1.2, 'high': 1.5, 'critical': 2.0}
                urgency_score = urgency_multiplier.get(urgency, 1.0)
                
                # Check expiry risk (prefer units with longer shelf life)
                avg_days_to_expiry = 0
                if available_units:
                    total_days = sum(unit.days_until_expiry() or 0 for unit in available_units)
                    avg_days_to_expiry = total_days / len(available_units)
                
                expiry_score = min(100, avg_days_to_expiry * 10)  # More days = better
                
                # Calculate final score
                final_score = (distance_score * 0.4 + expiry_score * 0.6) * urgency_score
                
                if final_score > best_score:
                    best_score = final_score
                    best_match = bank
        
        return best_match, best_score
        
    except Exception as e:
        print(f"ML prediction error: {e}")
        return None, 0.0

def ml_predict_eta(distance_km, urgency):
    """ML service integration for ETA prediction (mocked for demo)"""
    try:
        # Mock ETA prediction based on distance and urgency
        base_speed_kmh = 60  # Base speed in km/h
        
        # Urgency affects speed
        urgency_multiplier = {'low': 0.8, 'medium': 1.0, 'high': 1.2, 'critical': 1.5}
        speed_multiplier = urgency_multiplier.get(urgency, 1.0)
        
        # Calculate ETA in minutes
        effective_speed = base_speed_kmh * speed_multiplier
        eta_hours = distance_km / effective_speed
        eta_minutes = int(eta_hours * 60)
        
        # Add some randomness for demo purposes
        eta_minutes += random.randint(-10, 10)
        eta_minutes = max(15, eta_minutes)  # Minimum 15 minutes
        
        return eta_minutes
        
    except Exception as e:
        print(f"ETA prediction error: {e}")
        return 60  # Default 1 hour

@emergency_requests_bp.route('/emergency_requests', methods=['POST'])
def create_emergency_request():
    """Create a new emergency blood request"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        data = request.json
        blood_type = data.get('blood_type')
        quantity_ml = data.get('quantity_ml')
        urgency = data.get('urgency', 'high')
        notes = data.get('notes', '')
        
        if not all([blood_type, quantity_ml]):
            return jsonify({'error': 'Blood type and quantity are required'}), 400
        
        # Validate urgency
        valid_urgency = ['low', 'medium', 'high', 'critical']
        if urgency not in valid_urgency:
            return jsonify({'error': 'Invalid urgency level'}), 400
        
        # Get hospital ID from user's entity (should be SRM Global Hospitals)
        from src.models.user import User
        user = User.query.get(user_id)
        if not user or user.role != 'hospital':
            return jsonify({'error': 'Only hospitals can create emergency requests'}), 403
        
        hospital_id = user.entity_id
        if not hospital_id:
            return jsonify({'error': 'Hospital entity not found'}), 400
        
        # Verify this is SRM Global Hospitals
        hospital = Hospital.query.get(hospital_id)
        if hospital and 'SRM' in hospital.name:
            print(f"🏥 SRM Global Hospitals creating emergency request: {hospital.name}")
        else:
            print(f"⚠️ Warning: Hospital {hospital.name if hospital else 'Unknown'} is not SRM Global Hospitals")
        
        # Call ML service for bank matching
        suggested_bank, confidence_score = ml_predict_bank(
            hospital_id, blood_type, quantity_ml, urgency
        )
        
        if not suggested_bank:
            return jsonify({'error': 'No suitable blood bank found'}), 404
        
        # Predict ETA
        hospital = Hospital.query.get(hospital_id)
        distance = calculate_distance(
            hospital.latitude, hospital.longitude,
            suggested_bank.latitude, suggested_bank.longitude
        )
        
        predicted_eta = ml_predict_eta(distance, urgency)
        
        # Create emergency request
        emergency_request = EmergencyRequest(
            hospital_id=hospital_id,
            blood_type=blood_type,
            quantity_ml=quantity_ml,
            urgency=urgency,
            notes=notes,
            suggested_bank_id=suggested_bank.id,
            ml_confidence_score=confidence_score,
            predicted_eta_minutes=predicted_eta
        )
        
        db.session.add(emergency_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'request': emergency_request.to_dict(),
            'suggested_bank': suggested_bank.to_dict(),
            'ml_confidence': f"{confidence_score:.1f}%",
            'predicted_eta': f"{predicted_eta} minutes",
            'distance_km': f"{distance:.1f} km"
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/emergency_requests', methods=['GET'])
def get_emergency_requests():
    """Get emergency requests based on user role with consistent distance/time calculations"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        from src.models.user import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Filter requests based on role
        if user.role == 'hospital':
            # Hospitals see their own requests
            requests = EmergencyRequest.query.filter_by(hospital_id=user.entity_id).all()
        elif user.role == 'blood_bank':
            # Blood banks see requests where they are suggested
            requests = EmergencyRequest.query.filter_by(suggested_bank_id=user.entity_id).all()
        elif user.role == 'admin':
            # Admins see all requests
            requests = EmergencyRequest.query.all()
        else:
            return jsonify({'error': 'Unauthorized role'}), 403
        
        # Include related data with consistent distance/time calculations
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
                    
                    # Calculate consistent distance and time for both hospital and blood bank views
                    if hospital:
                        distance_km = calculate_distance(
                            hospital.latitude, hospital.longitude,
                            bank.latitude, bank.longitude
                        )
                        req_dict['calculated_distance_km'] = round(distance_km, 1)
                        req_dict['calculated_eta_minutes'] = ml_predict_eta(distance_km, req.urgency)
            
            # Get route details if exists
            route = Route.query.filter_by(request_id=req.id).first()
            if route:
                req_dict['route'] = route.to_dict()
            
            requests_data.append(req_dict)
        
        return jsonify(requests_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/demo/emergency_requests', methods=['GET'])
def get_demo_emergency_requests():
    """Demo endpoint to get all emergency requests without authentication (for hackathon demo)"""
    try:
        print("🔍 Demo endpoint called - returning all emergency requests")
        
        # Get all emergency requests
        requests = EmergencyRequest.query.all()
        
        # Include related data with consistent distance/time calculations
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
                    
                    # Calculate consistent distance and time for demo consistency
                    if hospital:
                        distance_km = calculate_distance(
                            hospital.latitude, hospital.longitude,
                            bank.latitude, bank.longitude
                        )
                        req_dict['calculated_distance_km'] = round(distance_km, 1)
                        req_dict['calculated_eta_minutes'] = ml_predict_eta(distance_km, req.urgency)
            
            # Get route details if exists
            route = Route.query.filter_by(request_id=req.id).first()
            if route:
                req_dict['route'] = route.to_dict()
            
            requests_data.append(req_dict)
        
        print(f"🔍 Demo endpoint returning {len(requests_data)} requests")
        return jsonify(requests_data), 200
        
    except Exception as e:
        print(f"❌ Demo endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/demo/emergency_requests', methods=['POST'])
def create_demo_emergency_request():
    """Demo endpoint to create emergency requests without authentication (for hackathon demo)"""
    try:
        print("🔍 Demo endpoint called - creating emergency request")
        
        data = request.json
        blood_type = data.get('blood_type')
        quantity_ml = data.get('quantity_ml')
        urgency = data.get('urgency', 'high')
        notes = data.get('notes', '')
        
        if not all([blood_type, quantity_ml]):
            return jsonify({'error': 'Blood type and quantity are required'}), 400
        
        # Validate urgency
        valid_urgency = ['low', 'medium', 'high', 'critical']
        if urgency not in valid_urgency:
            return jsonify({'error': 'Invalid urgency level'}), 400
        
        # Use SRM Global Hospitals specifically for demo
        hospital = Hospital.query.filter(Hospital.name.like('%SRM%')).first()
        if not hospital:
            # Fallback to first hospital if SRM not found
            hospital = Hospital.query.first()
        if not hospital:
            return jsonify({'error': 'No hospitals found in database'}), 404
        
        hospital_id = hospital.id
        print(f"🏥 Using hospital: {hospital.name} for demo emergency request")
        
        # Call ML service for bank matching
        suggested_bank, confidence_score = ml_predict_bank(
            hospital_id, blood_type, quantity_ml, urgency
        )
        
        if not suggested_bank:
            return jsonify({'error': 'No suitable blood bank found'}), 404
        
        # Predict ETA
        distance = calculate_distance(
            hospital.latitude, hospital.longitude,
            suggested_bank.latitude, suggested_bank.longitude
        )
        
        predicted_eta = ml_predict_eta(distance, urgency)
        
        # Create emergency request
        emergency_request = EmergencyRequest(
            hospital_id=hospital_id,
            blood_type=blood_type,
            quantity_ml=quantity_ml,
            urgency=urgency,
            notes=notes,
            suggested_bank_id=suggested_bank.id,
            ml_confidence_score=confidence_score,
            predicted_eta_minutes=predicted_eta
        )
        
        db.session.add(emergency_request)
        db.session.commit()
        
        print(f"✅ Demo emergency request created: {blood_type} {quantity_ml}ml")
        
        return jsonify({
            'success': True,
            'request': emergency_request.to_dict(),
            'suggested_bank': suggested_bank.to_dict(),
            'ml_confidence': f"{confidence_score:.1f}%",
            'predicted_eta': f"{predicted_eta} minutes",
            'distance_km': f"{distance:.1f} km"
        }), 201
        
    except Exception as e:
        print(f"❌ Demo endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/emergency_requests/<request_id>', methods=['GET'])
def get_emergency_request(request_id):
    """Get specific emergency request details"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        request_obj = EmergencyRequest.query.get(request_id)
        if not request_obj:
            return jsonify({'error': 'Request not found'}), 404
        
        # Check authorization
        from src.models.user import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role == 'hospital' and request_obj.hospital_id != user.entity_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if user.role == 'blood_bank' and request_obj.suggested_bank_id != user.entity_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get full request data
        request_data = request_obj.to_dict()
        
        # Include related data
        hospital = Hospital.query.get(request_obj.hospital_id)
        if hospital:
            request_data['hospital'] = hospital.to_dict()
        
        if request_obj.suggested_bank_id:
            bank = BloodBank.query.get(request_obj.suggested_bank_id)
            if bank:
                request_data['suggested_bank'] = bank.to_dict()
        
        route = Route.query.filter_by(request_id=request_id).first()
        if route:
            request_data['route'] = route.to_dict()
            
            # Get tracking points
            track_points = TrackPoint.query.filter_by(route_id=route.id).order_by(TrackPoint.timestamp).all()
            request_data['tracking'] = [point.to_dict() for point in track_points]
        
        return jsonify(request_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/emergency_requests/<request_id>/approve', methods=['POST'])
def approve_emergency_request(request_id):
    """Approve emergency request and create route (blood bank only)"""
    try:
        print(f"🔍 Approval endpoint called for request: {request_id}")
        print(f"📋 Session data: {dict(session)}")
        
        # Check authentication
        user_id = session.get('user_id')
        print(f"🆔 User ID from session: {user_id}")
        
        if not user_id:
            print("❌ No user_id in session")
            return jsonify({'error': 'Not authenticated'}), 401
        
        from src.models.user import User
        user = User.query.get(user_id)
        if not user:
            print(f"❌ User not found for ID: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"🔍 Approval attempt - User ID: {user_id}, Username: {user.username}, Role: '{user.role}', Entity ID: {user.entity_id}")
        print(f"🔍 Role comparison - user.role: '{user.role}', expected: 'blood_bank', match: {user.role == 'blood_bank'}")
        
        if user.role != 'blood_bank':
            print(f"❌ Role mismatch - Expected: 'blood_bank', Got: '{user.role}'")
            return jsonify({'error': 'Only blood banks can approve requests'}), 403
        
        # Get request
        request_obj = EmergencyRequest.query.get(request_id)
        if not request_obj:
            return jsonify({'error': 'Request not found'}), 404
        
        # Check if this blood bank is suggested
        if request_obj.suggested_bank_id != user.entity_id:
            return jsonify({'error': 'Unauthorized to approve this request'}), 403
        
        # Check if already approved
        if request_obj.status != 'created':
            return jsonify({'error': 'Request already processed'}), 400
        
        # Check blood availability
        available_units = BloodUnit.query.filter_by(
            blood_bank_id=user.entity_id,
            blood_type=request_obj.blood_type,
            status='available'
        ).all()
        
        total_available = sum(unit.quantity_ml for unit in available_units)
        if total_available < request_obj.quantity_ml:
            return jsonify({'error': 'Insufficient blood units available'}), 400
        
        # Reserve blood units
        remaining_quantity = request_obj.quantity_ml
        reserved_units = []
        
        for unit in available_units:
            if remaining_quantity <= 0:
                break
            
            quantity_to_reserve = min(remaining_quantity, unit.quantity_ml)
            unit.status = 'reserved'
            remaining_quantity -= quantity_to_reserve
            
            # Create request item
            request_item = RequestItem(
                request_id=request_id,
                unit_id=unit.id,
                source_bank_id=user.entity_id,
                quantity_ml=quantity_to_reserve
            )
            db.session.add(request_item)
            reserved_units.append(unit)
        
        # Update request status
        request_obj.status = 'approved'
        
        # Create route
        hospital = Hospital.query.get(request_obj.hospital_id)
        blood_bank = BloodBank.query.get(user.entity_id)
        
        # Get available driver
        from src.models.user import User
        driver_user = User.query.filter_by(role='driver', is_active=True).first()
        if not driver_user:
            print("❌ No driver users found in database")
            return jsonify({'error': 'No drivers available'}), 400
        
        print(f"🔍 Using driver: {driver_user.username}")
        
        # Create or get driver entity
        driver = Driver.query.filter_by(name=driver_user.username).first()
        if not driver:
            driver = Driver(
                name=driver_user.username,
                phone="+91-98765-43210",
                vehicle_number="TN-01-AB-1234"
            )
            db.session.add(driver)
            db.session.flush()
        
        # Calculate route details
        distance = calculate_distance(
            blood_bank.latitude, blood_bank.longitude,
            hospital.latitude, hospital.longitude
        )
        
        route = Route(
            request_id=request_id,
            driver_name=driver_user.username,  # Use the existing driver's username
            start_latitude=blood_bank.latitude,
            start_longitude=blood_bank.longitude,
            end_latitude=hospital.latitude,
            end_longitude=hospital.longitude,
            eta_minutes=request_obj.predicted_eta_minutes,
            distance_km=distance,
            status='pending'
        )
        
        db.session.add(route)
        db.session.commit()
        
        # Create driver notification after approval
        try:
            # Create a notification object for the driver
            driver_notification = {
                'id': f'driver_notification_{request_id}',
                'type': 'route_assigned',
                'route_id': route.id,
                'request_id': request_id,
                'driver_name': driver_user.username,
                'blood_type': request_obj.blood_type,
                'quantity_ml': request_obj.quantity_ml,
                'urgency': request_obj.urgency,
                'hospital_name': hospital.name,
                'blood_bank_name': blood_bank.name,
                'distance_km': distance,
                'eta_minutes': request_obj.predicted_eta_minutes,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active',
                'message': f'🚚 New blood delivery route assigned! {request_obj.blood_type} blood ({request_obj.quantity_ml}ml) from {blood_bank.name} to {hospital.name}. Distance: {distance:.1f}km, ETA: {request_obj.predicted_eta_minutes} minutes.'
            }
            
            # Store notification in database or session for driver to access
            # For now, we'll add it to the response so frontend can handle it
            print(f"🔔 Driver notification created: {driver_notification}")
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create driver notification: {e}")
            # Don't fail the approval if notification fails
        
        return jsonify({
            'success': True,
            'message': 'Request approved and route created',
            'request': request_obj.to_dict(),
            'route': route.to_dict(),
            'driver': driver.to_dict(),
            'reserved_units': len(reserved_units),
            'driver_notification': driver_notification if 'driver_notification' in locals() else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/emergency_requests/<request_id>/cancel', methods=['POST'])
def cancel_emergency_request(request_id):
    """Cancel emergency request"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        request_obj = EmergencyRequest.query.get(request_id)
        if not request_obj:
            return jsonify({'error': 'Request not found'}), 404
        
        # Check authorization
        from src.models.user import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role == 'hospital' and request_obj.hospital_id != user.entity_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if user.role == 'blood_bank' and request_obj.suggested_bank_id != user.entity_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update status
        request_obj.status = 'cancelled'
        
        # Release reserved blood units if any
        if request_obj.status == 'approved':
            request_items = RequestItem.query.filter_by(request_id=request_id).all()
            for item in request_items:
                unit = BloodUnit.query.get(item.unit_id)
                if unit and unit.status == 'reserved':
                    unit.status = 'available'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Request cancelled successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/demo/emergency_requests', methods=['GET'])
def demo_get_emergency_requests():
    """Demo endpoint to get emergency requests without authentication (for hackathon demo)"""
    try:
        print("🚀 DEMO Emergency Requests endpoint called - returning all requests")
        
        # Get all emergency requests for demo purposes
        requests = EmergencyRequest.query.all()
        
        requests_data = []
        for req in requests:
            request_dict = req.to_dict()
            
            # Get hospital details
            hospital = Hospital.query.get(req.hospital_id)
            if hospital:
                request_dict['hospital'] = hospital.to_dict()
            
            # Get blood bank details
            if req.suggested_bank_id:
                bank = BloodBank.query.get(req.suggested_bank_id)
                if bank:
                    request_dict['blood_bank'] = bank.to_dict()
            
            requests_data.append(request_dict)
        
        print(f"📡 DEMO Emergency Requests endpoint returning {len(requests_data)} requests")
        return jsonify(requests_data), 200
        
    except Exception as e:
        print(f"❌ DEMO Emergency Requests endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@emergency_requests_bp.route('/demo/emergency_requests/<request_id>/approve', methods=['POST'])
def demo_approve_emergency_request(request_id):
    """Demo endpoint to approve emergency request without authentication (for hackathon demo)"""
    try:
        print(f"🔍 DEMO Approval endpoint called for request: {request_id}")
        
        # Get request
        request_obj = EmergencyRequest.query.get(request_id)
        if not request_obj:
            return jsonify({'error': 'Request not found'}), 404
        
        print(f"🔍 DEMO Approval - Request found: {request_obj.id}")
        print(f"🔍 DEMO Approval - Hospital ID: {request_obj.hospital_id}")
        print(f"🔍 DEMO Approval - Blood Bank ID: {request_obj.suggested_bank_id}")
        
        # Check if already approved
        if request_obj.status != 'created':
            return jsonify({'error': 'Request already processed'}), 400
        
        # For demo purposes, use the assigned blood bank from the request
        demo_blood_bank_id = request_obj.suggested_bank_id
        demo_driver_name = 'demo_driver'
        
        print(f"🔍 DEMO Approval - Looking for hospital: {request_obj.hospital_id}")
        print(f"🔍 DEMO Approval - Looking for blood bank: {demo_blood_bank_id}")
        
        # Get actual hospital and blood bank data from database
        hospital = Hospital.query.get(request_obj.hospital_id)
        blood_bank = BloodBank.query.get(demo_blood_bank_id)
        
        if not hospital or not blood_bank:
            print(f"❌ DEMO Approval - Hospital or blood bank not found")
            return jsonify({'error': 'Hospital or blood bank not found'}), 404
        
        # Update request status
        request_obj.status = 'approved'
        
        # Get or create driver entity
        driver = Driver.query.filter_by(name=demo_driver_name).first()
        if not driver:
            driver = Driver(
                name=demo_driver_name,
                phone="+91-98765-43210",
                vehicle_number="TN-01-AB-1234"
            )
            db.session.add(driver)
            db.session.flush()
        
        # Calculate route details using real coordinates
        distance = calculate_distance(
            blood_bank.latitude, blood_bank.longitude,
            hospital.latitude, hospital.longitude
        )
        
        # Use default ETA if not set
        eta_minutes = request_obj.predicted_eta_minutes or 30
        
        # Create REAL route in database (not mock)
        route = Route(
            request_id=request_id,
            driver_name=demo_driver_name,
            start_latitude=blood_bank.latitude,
            start_longitude=blood_bank.longitude,
            end_latitude=hospital.latitude,
            end_longitude=hospital.longitude,
            eta_minutes=eta_minutes,
            distance_km=distance,
            status='pending'
        )
        
        db.session.add(route)
        db.session.commit()
        
        print(f"✅ DEMO Approval - Route created in database: {route.id}")
        
        # Create driver notification after approval
        try:
            # Create a notification object for the driver
            driver_notification = {
                'id': f'driver_notification_{request_id}',
                'type': 'route_assigned',
                'route_id': route.id,
                'request_id': request_id,
                'driver_name': demo_driver_name,
                'blood_type': request_obj.blood_type,
                'quantity_ml': request_obj.quantity_ml,
                'urgency': request_obj.urgency,
                'hospital_name': hospital.name,
                'blood_bank_name': blood_bank.name,
                'distance_km': distance,
                'eta_minutes': eta_minutes,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active',
                'message': f'🚚 New blood delivery route assigned! {request_obj.blood_type} blood ({request_obj.quantity_ml}ml) from {blood_bank.name} to {hospital.name}. Distance: {distance:.1f}km, ETA: {eta_minutes} minutes.'
            }
            
            print(f"🔔 DEMO Driver notification created: {driver_notification}")
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create driver notification: {e}")
            driver_notification = None
        
        return jsonify({
            'success': True,
            'message': 'Request approved and route created (DEMO)',
            'request': request_obj.to_dict(),
            'route': route.to_dict(),
            'driver': driver.to_dict(),
            'reserved_units': 1,
            'driver_notification': driver_notification
        }), 200
        
    except Exception as e:
        print(f"❌ DEMO Approval error: {e}")
        return jsonify({'error': str(e)}), 500
