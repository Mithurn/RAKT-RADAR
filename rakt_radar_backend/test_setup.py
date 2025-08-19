#!/usr/bin/env python3
"""
Simple test script to verify database setup
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_database_setup():
    """Test if we can create the database and models"""
    try:
        from src.main import app, db
        
        with app.app_context():
            print("✅ Flask app context created successfully")
            
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Test if we can import models
            from src.models.models import Hospital, BloodBank, User
            from src.models.user import User as UserModel
            print("✅ All models imported successfully")
            
            # Test basic queries
            hospital_count = Hospital.query.count()
            print(f"✅ Hospital count: {hospital_count}")
            
            user_count = UserModel.query.count()
            print(f"✅ User count: {user_count}")
            
            print("\n🎉 Database setup test passed!")
            return True
            
    except Exception as e:
        print(f"❌ Database setup test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing RAKT-RADAR database setup...")
    print("=" * 50)
    
    success = test_database_setup()
    
    if success:
        print("\n🚀 Ready to start the main application!")
        print("Run: python src/main.py")
    else:
        print("\n🔧 Please fix the issues above before starting the main app")
