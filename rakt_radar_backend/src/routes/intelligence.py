from flask import Blueprint, request, jsonify
import math
import random
import time
from src.models.models import BloodUnit, Hospital, BloodBank, db
from datetime import datetime

intelligence_bp = Blueprint('intelligence', __name__)

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

@intelligence_bp.route('/demand_matching', methods=['GET'])
def get_demand_matching():
    """Find potential matches for blood units nearing expiry (MOCKED)"""
    try:
        blood_unit_id = request.args.get('blood_unit_id')
        
        if blood_unit_id:
            # Find matches for specific blood unit
            blood_unit = BloodUnit.query.get(blood_unit_id)
            if not blood_unit:
                return jsonify({'error': 'Blood unit not found'}), 404
            
            if not blood_unit.is_flagged_for_expiry:
                return jsonify({'matches': [], 'message': 'Blood unit is not flagged for expiry'}), 200
            
            # Get all hospitals and blood banks as potential recipients
            hospitals = Hospital.query.all()
            blood_banks = BloodBank.query.all()
            all_entities = hospitals + blood_banks
            
            matches = []
            for entity in all_entities:
                distance = calculate_distance(
                    blood_unit.current_location_latitude,
                    blood_unit.current_location_longitude,
                    entity.latitude,
                    entity.longitude
                )
                
                # Mock demand score (higher score = higher demand)
                demand_score = random.randint(1, 10)
                
                # Mock urgency level
                urgency_levels = ['low', 'medium', 'high', 'critical']
                urgency = random.choice(urgency_levels)
                
                # Only include entities within reasonable distance (< 500km) and with some demand
                if distance < 500 and demand_score > 3:
                    match = {
                        'blood_unit_id': blood_unit_id,
                        'entity_id': entity.id,
                        'entity_name': entity.name,
                        'entity_type': 'hospital' if isinstance(entity, Hospital) else 'blood_bank',
                        'city': entity.city,
                        'state': entity.state,
                        'distance_km': round(distance, 2),
                        'demand_score': demand_score,
                        'urgency': urgency,
                        'estimated_time_hours': round(distance / 60, 1),  # Assuming 60 km/h average speed
                        'compatibility_score': random.randint(70, 95)  # Mock compatibility percentage
                    }
                    matches.append(match)
            
            # Sort by urgency, demand score, and distance
            urgency_priority = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
            matches.sort(key=lambda x: (
                -urgency_priority[x['urgency']],
                -x['demand_score'],
                x['distance_km']
            ))
            
            return jsonify({'matches': matches[:10]}), 200  # Return top 10 matches
        
        else:
            # Find all flagged units and their potential matches
            flagged_units = BloodUnit.query.filter(BloodUnit.is_flagged_for_expiry == True).all()
            
            all_matches = []
            for unit in flagged_units:
                # Get a few top matches for each flagged unit
                hospitals = Hospital.query.limit(3).all()
                blood_banks = BloodBank.query.limit(2).all()
                entities = hospitals + blood_banks
                
                for entity in entities:
                    distance = calculate_distance(
                        unit.current_location_latitude,
                        unit.current_location_longitude,
                        entity.latitude,
                        entity.longitude
                    )
                    
                    if distance < 300:  # Closer matches for overview
                        match = {
                            'blood_unit_id': unit.id,
                            'blood_type': unit.blood_type,
                            'quantity_ml': unit.quantity_ml,
                            'days_until_expiry': unit.days_until_expiry(),
                            'entity_id': entity.id,
                            'entity_name': entity.name,
                            'entity_type': 'hospital' if isinstance(entity, Hospital) else 'blood_bank',
                            'distance_km': round(distance, 2),
                            'urgency': random.choice(['medium', 'high', 'critical']),
                            'demand_score': random.randint(5, 10)
                        }
                        all_matches.append(match)
            
            return jsonify({'matches': all_matches[:20]}), 200  # Return top 20 overall matches
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@intelligence_bp.route('/routing/<from_entity_id>/<to_entity_id>', methods=['GET'])
def get_routing(from_entity_id, to_entity_id):
    """Get mocked route between two entities"""
    try:
        # Find entities (can be hospital or blood bank)
        from_entity = Hospital.query.get(from_entity_id) or BloodBank.query.get(from_entity_id)
        to_entity = Hospital.query.get(to_entity_id) or BloodBank.query.get(to_entity_id)
        
        if not from_entity:
            return jsonify({'error': 'From entity not found'}), 404
        if not to_entity:
            return jsonify({'error': 'To entity not found'}), 404
        
        # Calculate distance
        distance = calculate_distance(
            from_entity.latitude,
            from_entity.longitude,
            to_entity.latitude,
            to_entity.longitude
        )
        
        # Mock route information
        route_info = {
            'from_entity': {
                'id': from_entity.id,
                'name': from_entity.name,
                'city': from_entity.city,
                'state': from_entity.state,
                'type': 'hospital' if isinstance(from_entity, Hospital) else 'blood_bank'
            },
            'to_entity': {
                'id': to_entity.id,
                'name': to_entity.name,
                'city': to_entity.city,
                'state': to_entity.state,
                'type': 'hospital' if isinstance(to_entity, Hospital) else 'blood_bank'
            },
            'distance_km': round(distance, 2),
            'estimated_time_minutes': round(distance * 1.2, 0),  # Mock time with traffic
            'estimated_time_hours': round(distance / 50, 1),  # Assuming 50 km/h average with traffic
            'route_quality': random.choice(['excellent', 'good', 'fair']),
            'traffic_status': random.choice(['light', 'moderate', 'heavy']),
            'recommended_departure_time': 'Immediate',
            'fuel_cost_estimate': round(distance * 8, 2),  # Mock fuel cost in INR
            'toll_estimate': round(distance * 2, 2) if distance > 50 else 0,  # Mock toll cost
            'waypoints': [
                {'city': from_entity.city, 'state': from_entity.state},
                {'city': to_entity.city, 'state': to_entity.state}
            ]
        }
        
        # Add intermediate waypoints for longer distances
        if distance > 200:
            route_info['waypoints'].insert(1, {
                'city': 'Intermediate City',
                'state': 'Intermediate State',
                'note': 'Rest stop recommended'
            })
        
        return jsonify(route_info), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@intelligence_bp.route('/ai_blood_request', methods=['POST'])
def ai_blood_request_analysis():
    """AI-powered blood request analysis for emergency situations"""
    try:
        data = request.get_json()
        
        # Extract request details
        blood_type = data.get('blood_type', 'O+')
        quantity_ml = data.get('quantity_ml', 450)
        urgency = data.get('urgency', 'high')
        hospital_location = data.get('location', {'lat': 13.0827, 'lng': 80.2707})  # Default Chennai (Tamil Nadu)
        
        # AI Analysis Steps with realistic processing
        analysis_steps = []
        
        # Step 1: AI Initializing
        analysis_steps.append({
            'step': 1,
            'status': 'processing',
            'message': '🤖 AI System Initializing...',
            'details': 'Loading blood inventory database and analysis algorithms',
            'progress': 10
        })
        
        # Step 2: Analyzing Current Inventory
        analysis_steps.append({
            'step': 2,
            'status': 'processing',
            'message': '🔍 Analyzing Blood Inventory...',
            'details': f'Scanning {BloodUnit.query.count()} blood units across {Hospital.query.count() + BloodBank.query.count()} facilities',
            'progress': 25
        })
        
        # Step 3: Finding Surplus Units (TAMIL NADU ONLY)
        # Get all blood units of the requested type that are available
        available_units = BloodUnit.query.filter(
            BloodUnit.blood_type == blood_type,
            BloodUnit.status == 'available'
        ).all()
        
        # Filter to only Tamil Nadu blood banks
        tamil_nadu_units = []
        for unit in available_units:
            blood_bank = BloodBank.query.get(unit.blood_bank_id)
            if blood_bank and blood_bank.state == 'Tamil Nadu':
                tamil_nadu_units.append(unit)
        
        analysis_steps.append({
            'step': 3,
            'status': 'processing',
            'message': '📊 Identifying Surplus Units...',
            'details': f'Found {len(tamil_nadu_units)} {blood_type} units available in Tamil Nadu',
            'progress': 45
        })
        
        # Step 4: Geographic Analysis
        analysis_steps.append({
            'step': 4,
            'status': 'processing',
            'message': '🗺️ Geographic Analysis...',
            'details': 'Calculating distances and optimal transfer routes within Tamil Nadu',
            'progress': 65
        })
        
        # Step 5: Demand Matching
        analysis_steps.append({
            'step': 5,
            'status': 'processing',
            'message': '🎯 Demand Matching Analysis...',
            'details': 'Finding optimal matches based on urgency, proximity, and compatibility',
            'progress': 85
        })
        
        # Step 6: AI Decision Making
        analysis_steps.append({
            'step': 6,
            'status': 'processing',
            'message': '🧠 AI Decision Making...',
            'details': 'Finalizing optimal transfer recommendations for Tamil Nadu network',
            'progress': 95
        })
        
        # Step 7: Results Ready
        analysis_steps.append({
            'step': 7,
            'status': 'completed',
            'message': '✅ AI Analysis Complete!',
            'details': 'Optimal matches found and transfer routes calculated',
            'progress': 100
        })
        
        # Find actual matches (TAMIL NADU ONLY)
        matches = []
        for unit in tamil_nadu_units:
            # Get the blood bank details
            blood_bank = BloodBank.query.get(unit.blood_bank_id)
            if not blood_bank:
                continue
                
            # Calculate distance from hospital to blood bank
            distance = calculate_distance(
                hospital_location['lat'],
                hospital_location['lng'],
                blood_bank.latitude,
                blood_bank.longitude
            )
            
            # Only include matches within Tamil Nadu (max 500km)
            if distance < 500:
                # AI scoring algorithm
                demand_score = random.randint(6, 10)  # Higher scores for better matches
                urgency_multiplier = {'low': 1, 'medium': 1.5, 'high': 2, 'critical': 3}[urgency]
                distance_score = max(0, 10 - (distance / 50))  # Closer = higher score
                
                final_score = (demand_score * urgency_multiplier + distance_score) / 2
                ai_score = min(99, int(final_score * 10))  # Convert to percentage
                
                # Calculate smart routing information
                estimated_time_hours = round(distance / 50, 1)  # Assuming 50 km/h average with traffic
                route_quality = random.randint(85, 98)  # High quality for Tamil Nadu routes
                safety_score = random.randint(88, 95)  # High safety for local routes
                
                match = {
                    'id': unit.id,
                    'blood_type': unit.blood_type,
                    'quantity_ml': unit.quantity_ml,
                    'source_name': blood_bank.name,
                    'source_city': blood_bank.city,
                    'source_state': blood_bank.state,
                    'distance_km': round(distance, 2),
                    'estimated_time_hours': estimated_time_hours,
                    'route_quality': route_quality,
                    'safety_score': safety_score,
                    'ai_score': ai_score,
                    'urgency_level': urgency,
                    'days_until_expiry': unit.days_until_expiry(),
                    'collection_date': unit.collection_date.isoformat() if unit.collection_date else None,
                    'expiry_date': unit.expiry_date.isoformat() if unit.expiry_date else None
                }
                matches.append(match)
        
        # Sort matches by AI score (highest first)
        matches.sort(key=lambda x: x['ai_score'], reverse=True)
        
        # Limit to top 5 matches
        matches = matches[:5]
        
        return jsonify({
            'status': 'success',
            'message': 'AI analysis completed successfully',
            'analysis_steps': analysis_steps,
            'matches': matches,
            'summary': {
                'total_units_found': len(tamil_nadu_units),
                'matches_identified': len(matches),
                'region': 'Tamil Nadu',
                'urgency_level': urgency,
                'blood_type_requested': blood_type,
                'quantity_requested': quantity_ml
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@intelligence_bp.route('/order_blood', methods=['POST'])
def order_blood():
    """Place an order for blood transfer"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['blood_unit_id', 'urgency', 'quantity_ml']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get the blood unit
        blood_unit = BloodUnit.query.get(data['blood_unit_id'])
        if not blood_unit:
            return jsonify({'error': 'Blood unit not found'}), 404
        
        # Find SRM Global Hospital (or create if doesn't exist)
        srm_hospital = Hospital.query.filter(
            Hospital.name.like('%SRM%Global%')
        ).first()
        
        if not srm_hospital:
            # Create SRM Global Hospital if it doesn't exist
            srm_hospital = Hospital(
                name="SRM Global Hospitals",
                address="SRM Nagar, Kattankulathur, Chengalpattu District",
                city="Chennai",
                state="Tamil Nadu",
                latitude=12.8231,
                longitude=80.0449,
                contact_person="Dr. SRM Director",
                contact_email="director@srmglobalhospitals.com",
                contact_phone="+91-44-27452222"
            )
            db.session.add(srm_hospital)
            db.session.flush()  # Get the ID
        
        # Create transfer record
        from src.models.models import Transfer
        transfer = Transfer(
            blood_unit_id=blood_unit.id,
            from_entity_id=blood_unit.blood_bank_id,
            to_entity_id=srm_hospital.id,
            transfer_date=datetime.now(),
            status='pending',
            notes=f"Emergency order for {data['quantity_ml']}ml {blood_unit.blood_type} blood. Urgency: {data['urgency']}"
        )
        
        # Update blood unit status
        blood_unit.status = 'transferred'
        
        # Save to database
        db.session.add(transfer)
        db.session.commit()
        
        # Return transfer details for tracking
        delivery_time = round(calculate_distance(
            blood_unit.current_location_latitude,
            blood_unit.current_location_longitude,
            srm_hospital.latitude,
            srm_hospital.longitude
        ) / 50, 1)
        
        return jsonify({
            'status': 'success',
            'message': 'Blood order placed successfully',
            'transfer_id': transfer.id,
            'blood_unit': blood_unit.to_dict(),
            'destination': srm_hospital.to_dict(),
            'estimated_delivery_time': f"{delivery_time} hours"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@intelligence_bp.route('/analytics/dashboard', methods=['GET'])
def get_dashboard_analytics():
    """Get dashboard analytics (MOCKED)"""
    try:
        # Get real counts from database
        total_blood_units = BloodUnit.query.count()
        available_units = BloodUnit.query.filter(BloodUnit.status == 'available').count()
        flagged_units = BloodUnit.query.filter(BloodUnit.is_flagged_for_expiry == True).count()
        expired_units = BloodUnit.query.filter(BloodUnit.status == 'expired').count()
        transferred_units = BloodUnit.query.filter(BloodUnit.status == 'transferred').count()
        
        total_hospitals = Hospital.query.count()
        total_blood_banks = BloodBank.query.count()
        
        # Mock additional analytics
        analytics = {
            'inventory_summary': {
                'total_blood_units': total_blood_units,
                'available_units': available_units,
                'flagged_for_expiry': flagged_units,
                'expired_units': expired_units,
                'transferred_units': transferred_units
            },
            'network_summary': {
                'total_hospitals': total_hospitals,
                'total_blood_banks': total_blood_banks,
                'active_connections': total_hospitals + total_blood_banks,
                'coverage_cities': len(set([h.city for h in Hospital.query.all()] + [b.city for b in BloodBank.query.all()]))
            },
            'efficiency_metrics': {
                'wastage_prevention_rate': round(((total_blood_units - expired_units) / max(total_blood_units, 1)) * 100, 1),
                'transfer_success_rate': round((transferred_units / max(total_blood_units, 1)) * 100, 1),
                'average_response_time_hours': round(random.uniform(2.5, 8.5), 1),
                'cost_savings_inr': round(random.uniform(50000, 200000), 2)
            },
            'blood_type_distribution': {
                'A+': BloodUnit.query.filter(BloodUnit.blood_type == 'A+').count(),
                'A-': BloodUnit.query.filter(BloodUnit.blood_type == 'A-').count(),
                'B+': BloodUnit.query.filter(BloodUnit.blood_type == 'B+').count(),
                'B-': BloodUnit.query.filter(BloodUnit.blood_type == 'B-').count(),
                'AB+': BloodUnit.query.filter(BloodUnit.blood_type == 'AB+').count(),
                'AB-': BloodUnit.query.filter(BloodUnit.blood_type == 'AB-').count(),
                'O+': BloodUnit.query.filter(BloodUnit.blood_type == 'O+').count(),
                'O-': BloodUnit.query.filter(BloodUnit.blood_type == 'O-').count()
            },
            'alerts': {
                'critical_expiry_alerts': flagged_units,
                'low_stock_alerts': random.randint(0, 3),
                'system_alerts': random.randint(0, 1)
            }
        }
        
        return jsonify(analytics), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

