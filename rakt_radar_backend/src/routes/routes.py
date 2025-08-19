from flask import Blueprint, request, jsonify, session
import math
import random
from datetime import datetime, timedelta
from src.models.models import Route, TrackPoint, EmergencyRequest, Hospital, BloodBank, Driver, db

routes_bp = Blueprint('routes', __name__)

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

def interpolate_position(start_lat, start_lng, end_lat, end_lng, progress_percent):
    """Interpolate position along a route based on progress percentage"""
    # Simple linear interpolation
    lat = start_lat + (end_lat - start_lat) * progress_percent
    lng = start_lng + (end_lng - start_lng) * progress_percent
    return lat, lng

@routes_bp.route('/routes', methods=['GET'])
def get_routes():
    """Get routes based on user role"""
    try:
        print("🚀 ROUTES ENDPOINT - UPDATED CODE LOADED! 🚀")
        
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        from src.models.user import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        print(f"🔍 Routes endpoint - User: {user.username}, Role: {user.role}")
        
        # Filter routes based on role
        if user.role == 'driver':
            # Drivers see routes assigned to them
            print(f"🚚 Driver {user.username} looking for routes with driver_name={user.username}")
            routes = Route.query.filter_by(driver_name=user.username).all()
            print(f"📡 Found {len(routes)} routes for driver {user.username}")
        elif user.role == 'hospital':
            # Hospitals see routes for their requests
            requests = EmergencyRequest.query.filter_by(hospital_id=user.entity_id).all()
            request_ids = [req.id for req in requests]
            routes = Route.query.filter(Route.request_id.in_(request_ids)).all()
        elif user.role == 'blood_bank':
            # Blood banks see routes from their requests
            requests = EmergencyRequest.query.filter_by(suggested_bank_id=user.entity_id).all()
            request_ids = [req.id for req in requests]
            routes = Route.query.filter(Route.request_id.in_(request_ids)).all()
        elif user.role == 'admin':
            # Admins see all routes
            routes = Route.query.all()
        else:
            return jsonify({'error': 'Unauthorized role'}), 403
        
        # Include related data
        routes_data = []
        for route in routes:
            route_dict = route.to_dict()
            
            # Get request details
            request_obj = EmergencyRequest.query.get(route.request_id)
            if request_obj:
                route_dict['request'] = request_obj.to_dict()
                
                # Get hospital details
                hospital = Hospital.query.get(request_obj.hospital_id)
                if hospital:
                    route_dict['hospital'] = hospital.to_dict()
                
                # Get blood bank details
                if request_obj.suggested_bank_id:
                    bank = BloodBank.query.get(request_obj.suggested_bank_id)
                    if bank:
                        route_dict['blood_bank'] = bank.to_dict()
            
            # Get tracking points
            track_points = TrackPoint.query.filter_by(route_id=route.id).order_by(TrackPoint.timestamp).all()
            route_dict['tracking'] = [point.to_dict() for point in track_points]
            
            # Calculate current progress - WITH SAFETY CHECKS
            if route.status == 'active' and track_points and route.distance_km > 0:
                # Calculate progress based on distance covered
                total_distance = route.distance_km
                if len(track_points) > 1:
                    # Calculate actual distance covered
                    covered_distance = 0
                    for i in range(1, len(track_points)):
                        covered_distance += calculate_distance(
                            track_points[i-1].latitude, track_points[i-1].longitude,
                            track_points[i].latitude, track_points[i].longitude
                        )
                    
                    # Safety check to prevent division by zero
                    if total_distance > 0:
                        progress_percent = min(1.0, covered_distance / total_distance)
                        route_dict['progress_percent'] = round(progress_percent * 100, 1)
                        route_dict['distance_covered_km'] = round(covered_distance, 2)
                    else:
                        route_dict['progress_percent'] = 0.0
                        route_dict['distance_covered_km'] = 0.0
                else:
                    route_dict['progress_percent'] = 0.0
                    route_dict['distance_covered_km'] = 0.0
            else:
                route_dict['progress_percent'] = 0.0
                route_dict['distance_covered_km'] = 0.0
            
            routes_data.append(route_dict)
        
        return jsonify(routes_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/routes/<route_id>', methods=['GET'])
def get_route(route_id):
    """Get specific route details"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        route = Route.query.get(route_id)
        if not route:
            return jsonify({'error': 'Route not found'}), 404
        
        # Check authorization
        from src.models.user import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has access to this route
        has_access = False
        if user.role == 'admin':
            has_access = True
        elif user.role == 'driver' and route.driver_name == user.username:
            has_access = True
        else:
            # Check if route is related to user's entity
            request_obj = EmergencyRequest.query.get(route.request_id)
            if request_obj:
                if user.role == 'hospital' and request_obj.hospital_id == user.entity_id:
                    has_access = True
                elif user.role == 'blood_bank' and request_obj.suggested_bank_id == user.entity_id:
                    has_access = True
        
        if not has_access:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get full route data
        route_data = route.to_dict()
        
        # Include related data
        request_obj = EmergencyRequest.query.get(route.request_id)
        if request_obj:
            route_data['request'] = request_obj.to_dict()
            
            hospital = Hospital.query.get(request_obj.hospital_id)
            if hospital:
                route_data['hospital'] = hospital.to_dict()
            
            if request_obj.suggested_bank_id:
                bank = BloodBank.query.get(request_obj.suggested_bank_id)
                if bank:
                    route_data['blood_bank'] = bank.to_dict()
        
        # Get tracking points
        track_points = TrackPoint.query.filter_by(route_id=route_id).order_by(TrackPoint.timestamp).all()
        route_data['tracking'] = [point.to_dict() for point in track_points]
        
        # Calculate progress - TEMPORARILY DISABLED TO FIX DIVISION BY ZERO
        route_data['progress_percent'] = 0.0
        route_data['distance_covered_km'] = 0.0
        
        # TODO: Re-enable progress calculation after fixing distance issues
        # if route.status == 'active' and track_points:
        #     total_distance = route.distance_km
        #     print(f"🔍 Progress calculation - Route ID: {route_id}, Total distance: {total_distance}, Track points: {len(track_points)}")
        #     
        #     if total_distance > 0 and len(track_points) > 1:
        #         covered_distance = 0
        #         for i in range(1, len(track_points)):
        #             covered_distance += calculate_distance(
        #                 track_points[i-1].latitude, track_points[i-1].longitude,
        #                 track_points[i].latitude, track_points[i].longitude
        #             )
        #         
        #         print(f"🔍 Distance calculation - Covered: {covered_distance}, Total: {total_distance}")
        #         progress_percent = min(1.0, covered_distance / total_distance)
        #         route_data['progress_percent'] = round(progress_percent * 100, 1)
        #         route_data['distance_covered_km'] = round(covered_distance, 2)
        #         
        #         # Calculate remaining ETA
        #         if progress_percent > 0:
        #             remaining_distance = total_distance - covered_distance
        #             # Estimate remaining time based on progress
        #             elapsed_time = (track_points[-1].timestamp - track_points[0].timestamp).total_seconds() / 60
        #             if elapsed_time > 0:
        #                 rate = covered_distance / elapsed_time  # km/min
        #                 if rate > 0:
        #                     remaining_eta = remaining_distance / rate
        #                             route_data['remaining_eta_minutes'] = round(remaining_eta, 1)
        #     else:
        #         print(f"⚠️ Skipping progress calculation - Total distance: {total_distance}, Track points: {len(track_points)}")
        #         route_data['progress_percent'] = 0.0
        #         route_data['distance_covered_km'] = 0.0
        # else:
        #     route_data['progress_percent'] = 0.0
        #     route_data['distance_covered_km'] = 0.0
        
        return jsonify(route_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/routes/<route_id>/start', methods=['POST'])
def start_route(route_id):
    """Start a route (driver only)"""
    try:
        print(f"🚚 Start route endpoint called for route: {route_id}")
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
        
        print(f"🔍 Start route attempt - User: {user.username}, Role: '{user.role}'")
        
        if not user or user.role != 'driver':
            print(f"❌ Role mismatch - Expected: 'driver', Got: '{user.role}'")
            return jsonify({'error': 'Only drivers can start routes'}), 403
        
        route = Route.query.get(route_id)
        if not route:
            print(f"❌ Route not found: {route_id}")
            return jsonify({'error': 'Route not found'}), 404
        
        print(f"🔍 Route details - Driver name: '{route.driver_name}', User username: '{user.username}'")
        print(f"🔍 Driver comparison - route.driver_name: '{route.driver_name}', user.username: '{user.username}', match: {route.driver_name == user.username}")
        
        # Check if driver is assigned to this route
        if route.driver_name != user.username:
            print(f"❌ Driver mismatch - Route driver: '{route.driver_name}', Current user: '{user.username}'")
            return jsonify({'error': 'Unauthorized to start this route'}), 403
        
        # Check if route can be started
        if route.status == 'active':
            print(f"ℹ️ Route already active - Started at: {route.started_at}")
            return jsonify({
                'success': True,
                'message': 'Route is already active',
                'route': route.to_dict()
            }), 200
        elif route.status == 'completed':
            print(f"ℹ️ Route already completed - Completed at: {route.completed_at}")
            return jsonify({
                'success': True,
                'message': 'Route is already completed',
                'route': route.to_dict()
            }), 200
        elif route.status != 'pending':
            print(f"❌ Route status issue - Current status: '{route.status}', Expected: 'pending'")
            return jsonify({'error': f'Route cannot be started. Current status: {route.status}'}), 400
        
        # Update route status
        route.status = 'active'
        route.started_at = datetime.utcnow()
        
        # Create initial tracking point at start location
        initial_point = TrackPoint(
            route_id=route_id,
            latitude=route.start_latitude,
            longitude=route.start_longitude
        )
        db.session.add(initial_point)
        
        # Update driver availability
        driver = Driver.query.filter_by(name=user.username).first()
        if driver:
            driver.is_available = False
            driver.current_latitude = route.start_latitude
            driver.current_longitude = route.start_longitude
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Route started successfully',
            'route': route.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/routes/<route_id>/progress', methods=['POST'])
def update_route_progress(route_id):
    """Update route progress with new tracking point (driver only)"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        from src.models.user import User
        user = User.query.get(user_id)
        if not user or user.role != 'driver':
            return jsonify({'error': 'Only drivers can update route progress'}), 403
        
        route = Route.query.get(route_id)
        if not route:
            return jsonify({'error': 'Route not found'}), 404
        
        # Check if driver is assigned to this route
        if route.driver_name != user.username:
            return jsonify({'error': 'Unauthorized to update this route'}), 403
        
        # Check if route is active
        if route.status != 'active':
            return jsonify({'error': 'Route is not active'}), 400
        
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not latitude or not longitude:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        # Create new tracking point
        track_point = TrackPoint(
            route_id=route_id,
            latitude=latitude,
            longitude=longitude
        )
        db.session.add(track_point)
        
        # Update driver location
        driver = Driver.query.filter_by(name=user.username).first()
        if driver:
            driver.current_latitude = latitude
            driver.current_longitude = longitude
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Progress updated successfully',
            'track_point': track_point.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/routes/<route_id>/complete', methods=['POST'])
def complete_route(route_id):
    """Complete a route (driver only)"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        from src.models.user import User
        user = User.query.get(user_id)
        if not user or user.role != 'driver':
            return jsonify({'error': 'Only drivers can complete routes'}), 403
        
        route = Route.query.get(route_id)
        if not route:
            return jsonify({'error': 'Route not found'}), 404
        
        # Check if driver is assigned to this route
        if route.driver_name != user.username:
            return jsonify({'error': 'Unauthorized to complete this route'}), 403
        
        # Check if route is active
        if route.status != 'active':
            return jsonify({'error': 'Route is not active'}), 400
        
        # Update route status
        route.status = 'completed'
        route.completed_at = datetime.utcnow()
        
        # Update emergency request status
        request_obj = EmergencyRequest.query.get(route.request_id)
        if request_obj:
            request_obj.status = 'delivered'
        
        # Update blood unit status
        from src.models.models import RequestItem
        request_items = RequestItem.query.filter_by(request_id=route.request_id).all()
        for item in request_items:
            unit = db.session.get('blood_units', item.unit_id)
            if unit:
                unit.status = 'used'
        
        # Update driver availability
        driver = Driver.query.filter_by(name=user.username).first()
        if driver:
            driver.is_available = True
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Route completed successfully',
            'route': route.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/routes/<route_id>/simulate', methods=['POST'])
def simulate_route_progress(route_id):
    """Simulate route progress for demo purposes (admin only)"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        from src.models.user import User
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        route = Route.query.get(route_id)
        if not route:
            return jsonify({'error': 'Route not found'}), 404
        
        # Check if route is active
        if route.status != 'active':
            return jsonify({'error': 'Route is not active'}), 400
        
        data = request.json
        progress_percent = data.get('progress_percent', 0.5)  # Default 50%
        
        if not 0 <= progress_percent <= 1:
            return jsonify({'error': 'Progress must be between 0 and 1'}), 400
        
        # Calculate new position
        new_lat, new_lng = interpolate_position(
            route.start_latitude, route.start_longitude,
            route.end_latitude, route.end_longitude,
            progress_percent
        )
        
        # Create tracking point
        track_point = TrackPoint(
            route_id=route_id,
            latitude=new_lat,
            longitude=new_lng
        )
        db.session.add(track_point)
        
        # Update driver location if exists
        driver = Driver.query.filter_by(name=route.driver_name).first()
        if driver:
            driver.current_latitude = new_lat
            driver.current_longitude = new_lng
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Route progress simulated successfully',
            'track_point': track_point.to_dict(),
            'progress_percent': progress_percent * 100
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/routes/tracking/<request_id>', methods=['GET'])
def get_route_tracking(request_id):
    """Get route tracking information for a specific emergency request"""
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        from src.models.user import User
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get the emergency request
        from src.models.models import EmergencyRequest
        request_obj = EmergencyRequest.query.get(request_id)
        if not request_obj:
            return jsonify({'error': 'Request not found'}), 404
        
        # Check authorization based on role
        if user.role == 'hospital' and request_obj.hospital_id != user.entity_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if user.role == 'blood_bank' and request_obj.suggested_bank_id != user.entity_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get the route
        route = Route.query.filter_by(request_id=request_id).first()
        if not route:
            return jsonify({'error': 'Route not found'}), 404
        
        # Get tracking points
        track_points = TrackPoint.query.filter_by(route_id=route.id).order_by(TrackPoint.timestamp).all()
        
        # Get related entities
        from src.models.models import Hospital, BloodBank, Driver
        hospital = Hospital.query.get(request_obj.hospital_id)
        blood_bank = BloodBank.query.get(request_obj.suggested_bank_id)
        driver = Driver.query.filter_by(name=route.driver_name).first()
        
        # Calculate progress - WITH SAFETY CHECKS
        total_distance = route.distance_km
        if track_points and total_distance > 0:
            # Calculate distance covered
            covered_distance = 0
            for i in range(1, len(track_points)):
                prev_point = track_points[i-1]
                curr_point = track_points[i]
                covered_distance += calculate_distance(
                    prev_point.latitude, prev_point.longitude,
                    curr_point.latitude, curr_point.longitude
                )
            
            # Safety check to prevent division by zero
            if total_distance > 0:
                progress_percentage = min(100, (covered_distance / total_distance) * 100)
                remaining_distance = max(0, total_distance - covered_distance)
            else:
                progress_percentage = 0
                remaining_distance = 0
        else:
            progress_percentage = 0
            remaining_distance = total_distance if total_distance > 0 else 0
        
        # Estimate current ETA based on progress
        if progress_percentage > 0 and total_distance > 0:
            estimated_remaining_time = int((remaining_distance / total_distance) * route.eta_minutes)
        else:
            estimated_remaining_time = route.eta_minutes
        
        tracking_data = {
            'request': {
                'id': request_obj.id,
                'blood_type': request_obj.blood_type,
                'quantity_ml': request_obj.quantity_ml,
                'urgency': request_obj.urgency,
                'status': request_obj.status,
                'created_at': request_obj.created_at.isoformat() if request_obj.created_at else None
            },
            'route': {
                'id': route.id,
                'status': route.status,
                'distance_km': route.distance_km,
                'eta_minutes': route.eta_minutes,
                'started_at': route.started_at.isoformat() if route.started_at else None,
                'completed_at': route.completed_at.isoformat() if route.completed_at else None
            },
            'locations': {
                'start': {
                    'name': blood_bank.name if blood_bank else 'Blood Bank',
                    'latitude': route.start_latitude,
                    'longitude': route.start_longitude,
                    'address': f"{blood_bank.city}, {blood_bank.state}" if blood_bank else 'Unknown'
                },
                'end': {
                    'name': hospital.name if hospital else 'Hospital',
                    'latitude': route.end_latitude,
                    'longitude': route.end_longitude,
                    'address': f"{hospital.city}, {hospital.state}" if hospital else 'Unknown'
                }
            },
            'driver': {
                'name': route.driver_name,
                'phone': driver.phone if driver else 'Unknown',
                'vehicle_number': driver.vehicle_number if driver else 'Unknown'
            },
            'tracking': {
                'progress_percentage': round(progress_percentage, 1),
                'covered_distance_km': round(total_distance - remaining_distance, 2),
                'remaining_distance_km': round(remaining_distance, 2),
                'estimated_remaining_time_minutes': estimated_remaining_time,
                'current_status': route.status,
                'track_points': [point.to_dict() for point in track_points]
            }
        }
        
        return jsonify(tracking_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
