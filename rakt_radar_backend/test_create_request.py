#!/usr/bin/env python3
"""
Test script to create an emergency request manually
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_create_emergency_request():
    """Test creating an emergency request manually"""
    try:
        from src.main import app, db
        
        with app.app_context():
            print("🧪 Testing Emergency Request Creation...")
            print("=" * 50)
            
            # Import models
            from src.models.models import EmergencyRequest, Hospital, BloodBank, BloodUnit
            from src.models.user import User
            
            # Get the first hospital user
            hospital_user = User.query.filter_by(role='hospital').first()
            if not hospital_user:
                print("❌ No hospital user found!")
                return
            
            print(f"🏥 Hospital User: {hospital_user.username} (entity_id: {hospital_user.entity_id})")
            
            # Get the hospital entity
            hospital = Hospital.query.get(hospital_user.entity_id)
            if not hospital:
                print("❌ Hospital entity not found!")
                return
            
            print(f"🏥 Hospital: {hospital.name} (lat: {hospital.latitude}, lng: {hospital.longitude})")
            
            # Get the first blood bank
            blood_bank = BloodBank.query.first()
            if not blood_bank:
                print("❌ No blood bank found!")
                return
            
            print(f"🩸 Blood Bank: {blood_bank.name} (id: {blood_bank.id})")
            
            # Check if blood bank has the required blood type
            blood_type = 'A+'
            quantity_ml = 500
            
            available_units = BloodUnit.query.filter_by(
                blood_bank_id=blood_bank.id,
                blood_type=blood_type,
                status='available'
            ).all()
            
            total_available = sum(unit.quantity_ml for unit in available_units)
            print(f"💉 Available {blood_type} blood: {total_available}ml")
            
            if total_available < quantity_ml:
                print(f"❌ Not enough blood available! Need {quantity_ml}ml, have {total_available}ml")
                return
            
            # Create emergency request manually
            print(f"\n🚨 Creating Emergency Request...")
            
            emergency_request = EmergencyRequest(
                hospital_id=hospital.id,
                blood_type=blood_type,
                quantity_ml=quantity_ml,
                urgency='high',
                notes='Test emergency request for demo',
                suggested_bank_id=blood_bank.id,
                ml_confidence_score=95.0,
                predicted_eta_minutes=60
            )
            
            db.session.add(emergency_request)
            db.session.commit()
            
            print(f"✅ Emergency Request created successfully!")
            print(f"   ID: {emergency_request.id}")
            print(f"   Hospital: {emergency_request.hospital_id}")
            print(f"   Suggested Bank: {emergency_request.suggested_bank_id}")
            print(f"   Status: {emergency_request.status}")
            
            # Now test if blood bank can see it
            print(f"\n🔍 Testing if blood bank can see the request...")
            
            blood_bank_user = User.query.filter_by(role='blood_bank').first()
            if blood_bank_user:
                print(f"   Blood Bank User: {blood_bank_user.username} (entity_id: {blood_bank_user.entity_id})")
                
                # Test the exact query from the API
                requests_for_bank = EmergencyRequest.query.filter_by(suggested_bank_id=blood_bank_user.entity_id).all()
                print(f"   Requests where suggested_bank_id = {blood_bank_user.entity_id}: {len(requests_for_bank)}")
                
                if requests_for_bank:
                    for req in requests_for_bank:
                        print(f"     ✅ Found Request {req.id}: {req.blood_type} {req.quantity_ml}ml")
                else:
                    print(f"     ❌ Still no requests found!")
                    
                    # Check all requests
                    all_requests = EmergencyRequest.query.all()
                    print(f"     Total requests in database: {len(all_requests)}")
                    for req in all_requests:
                        print(f"       • Request {req.id}: suggested_bank_id = {req.suggested_bank_id}")
            
            print("\n🎯 Test completed!")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_create_emergency_request()
