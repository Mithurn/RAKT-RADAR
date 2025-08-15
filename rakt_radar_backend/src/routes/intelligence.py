from flask import Blueprint, request, jsonify
import math
import random
from src.models.models import BloodUnit, Hospital, BloodBank, db

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

