#!/usr/bin/env python3
"""
Test script to debug emergency request flow
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_emergency_requests():
    """Test emergency request creation and retrieval"""
    try:
        from src.main import app, db
        
        with app.app_context():
            print("🧪 Testing Emergency Request Flow...")
            print("=" * 50)
            
            # Import models
            from src.models.models import EmergencyRequest, Hospital, BloodBank, BloodUnit
            from src.models.user import User
            
            # Check what exists
            print(f"🏥 Hospitals: {Hospital.query.count()}")
            print(f"🩸 Blood Banks: {BloodBank.query.count()}")
            print(f"💉 Blood Units: {BloodUnit.query.count()}")
            print(f"👥 Users: {User.query.count()}")
            print(f"🚨 Emergency Requests: {EmergencyRequest.query.count()}")
            
            # Check blood bank users
            blood_bank_users = User.query.filter_by(role='blood_bank').all()
            print(f"\n🩸 Blood Bank Users:")
            for user in blood_bank_users:
                print(f"  • {user.username} (entity_id: {user.entity_id})")
            
            # Check hospitals
            hospitals = Hospital.query.all()
            print(f"\n🏥 Hospitals:")
            for hospital in hospitals[:3]:  # Show first 3
                print(f"  • {hospital.name} (id: {hospital.id})")
            
            # Check blood banks
            blood_banks = BloodBank.query.all()
            print(f"\n🩸 Blood Banks:")
            for bank in blood_banks[:3]:  # Show first 3
                print(f"  • {bank.name} (id: {bank.id})")
            
            # Check emergency requests
            requests = EmergencyRequest.query.all()
            print(f"\n🚨 Emergency Requests:")
            for req in requests:
                print(f"  • ID: {req.id}")
                print(f"    Hospital: {req.hospital_id}")
                print(f"    Suggested Bank: {req.suggested_bank_id}")
                print(f"    Blood Type: {req.blood_type}")
                print(f"    Status: {req.status}")
                print(f"    ---")
            
            # Test the query logic
            if blood_bank_users:
                user = blood_bank_users[0]
                print(f"\n🔍 Testing query for user: {user.username}")
                print(f"   User entity_id: {user.entity_id}")
                
                # Test the exact query from the API
                requests_for_bank = EmergencyRequest.query.filter_by(suggested_bank_id=user.entity_id).all()
                print(f"   Requests where suggested_bank_id = {user.entity_id}: {len(requests_for_bank)}")
                
                if requests_for_bank:
                    for req in requests_for_bank:
                        print(f"     • Request {req.id}: {req.blood_type} {req.quantity_ml}ml")
                else:
                    print(f"     ❌ No requests found!")
                    
                    # Check if there are any requests at all
                    all_requests = EmergencyRequest.query.all()
                    if all_requests:
                        print(f"     But there are {len(all_requests)} total requests:")
                        for req in all_requests:
                            print(f"       • Request {req.id}: suggested_bank_id = {req.suggested_bank_id}")
            
            print("\n🎯 Test completed!")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_emergency_requests()
