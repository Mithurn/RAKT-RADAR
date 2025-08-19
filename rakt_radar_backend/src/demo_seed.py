import hashlib
import uuid
from datetime import datetime, date, timedelta
from src.models.user import User, db
from src.models.models import Hospital, BloodBank, Driver, BloodUnit

def hash_password(password):
    """Simple password hashing for demo purposes"""
    return hashlib.sha256(password.encode()).hexdigest()

def seed_demo_users():
    """Seed demo users for all roles"""
    print("🌱 Seeding demo users...")
    
    # Check if users already exist
    if User.query.count() > 0:
        print("✅ Users already exist, skipping user creation")
        return
    
    # Get existing entities
    hospitals = Hospital.query.all()
    blood_banks = BloodBank.query.all()
    
    if not hospitals or not blood_banks:
        print("❌ No hospitals or blood banks found. Please run mock_data.py first.")
        return
    
    # Create demo users
    demo_users = [
        # Hospital users
        {
            'username': 'apollo_hospital',
            'email': 'admin@apollohospitals.com',
            'password': 'hospital123',
            'role': 'hospital',
            'entity_id': hospitals[0].id if hospitals else None
        },
        {
            'username': 'fortis_hospital',
            'email': 'admin@fortismalar.com',
            'password': 'hospital123',
            'role': 'hospital',
            'entity_id': hospitals[1].id if len(hospitals) > 1 else None
        },
        
        # Blood Bank users
        {
            'username': 'chennai_blood_bank',
            'email': 'admin@chennaibloodbank.com',
            'password': 'bank123',
            'role': 'blood_bank',
            'entity_id': blood_banks[0].id if blood_banks else None
        },
        {
            'username': 'red_cross_bank',
            'email': 'admin@redcrosschennai.com',
            'password': 'bank123',
            'role': 'blood_bank',
            'entity_id': blood_banks[1].id if len(blood_banks) > 1 else None
        },
        
        # Driver users
        {
            'username': 'demo_driver',
            'email': 'driver@raktradar.com',
            'password': 'driver123',
            'role': 'driver',
            'entity_id': None  # Will be created
        },
        {
            'username': 'driver_2',
            'email': 'driver2@raktradar.com',
            'password': 'driver123',
            'role': 'driver',
            'entity_id': None  # Will be created
        },
        
        # Admin user
        {
            'username': 'admin',
            'email': 'admin@raktradar.com',
            'password': 'admin123',
            'role': 'admin',
            'entity_id': None
        }
    ]
    
    # Create driver entities first
    drivers = []
    for user_data in demo_users:
        if user_data['role'] == 'driver':
            driver = Driver(
                name=user_data['username'],  # Use username directly, not converted to title case
                phone=f"+91-98765-{str(uuid.uuid4())[:4]}",
                vehicle_number=f"TN-01-{user_data['username'][:2].upper()}-{str(uuid.uuid4())[:4]}"
            )
            db.session.add(driver)
            db.session.flush()  # Get the ID
            user_data['entity_id'] = driver.id
            drivers.append(driver)
    
    # Create users
    created_users = []
    for user_data in demo_users:
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            password_hash=hash_password(user_data['password']),
            role=user_data['role'],
            entity_id=user_data['entity_id']
        )
        db.session.add(user)
        created_users.append(user)
    
    try:
        db.session.commit()
        print(f"✅ Created {len(created_users)} demo users:")
        
        for user in created_users:
            entity_info = ""
            if user.entity_id:
                if user.role == 'hospital':
                    hospital = Hospital.query.get(user.entity_id)
                    entity_info = f" ({hospital.name})" if hospital else ""
                elif user.role == 'blood_bank':
                    bank = BloodBank.query.get(user.entity_id)
                    entity_info = f" ({bank.name})" if bank else ""
                elif user.role == 'driver':
                    driver = Driver.query.get(user.entity_id)
                    entity_info = f" ({driver.name} - {driver.vehicle_number})" if driver else ""
            
            print(f"   • {user.username} ({user.role}){entity_info}")
        
        print("\n🔑 Demo Credentials:")
        print("   Hospital: apollo_hospital / hospital123")
        print("   Blood Bank: chennai_blood_bank / bank123")
        print("   Driver: demo_driver / driver123")
        print("   Admin: admin / admin123")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating users: {e}")

def seed_demo_blood_units():
    """Seed additional blood units for demo purposes"""
    print("\n🩸 Seeding demo blood units...")
    
    # Get blood banks
    blood_banks = BloodBank.query.all()
    if not blood_banks:
        print("❌ No blood banks found")
        return
    
    # Check if we need to add more units
    existing_units = BloodUnit.query.count()
    if existing_units > 100:  # Already have enough
        print("✅ Sufficient blood units already exist")
        return
    
    blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    
    # Create additional units
    for i in range(50):  # Add 50 more units
        bank = blood_banks[i % len(blood_banks)]
        blood_type = blood_types[i % len(blood_types)]
        
        # Random dates
        collection_date = date.today() - timedelta(days=i % 30)
        expiry_date = collection_date + timedelta(days=42)  # 6 weeks shelf life
        
        # Random location near the bank
        lat_offset = (i % 10 - 5) * 0.01  # ±0.05 degrees
        lng_offset = (i % 10 - 5) * 0.01
        
        unit = BloodUnit(
            blood_bank_id=bank.id,
            blood_type=blood_type,
            quantity_ml=450,  # Standard blood unit
            collection_date=collection_date,
            expiry_date=expiry_date,
            status='available',
            is_flagged_for_expiry=expiry_date - date.today() <= timedelta(days=7),
            current_location_latitude=bank.latitude + lat_offset,
            current_location_longitude=bank.longitude + lng_offset
        )
        db.session.add(unit)
    
    try:
        db.session.commit()
        print(f"✅ Added 50 additional blood units")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating blood units: {e}")

def main():
    """Main seeding function"""
    print("🚀 Starting RAKT-RADAR Demo Data Seeding...")
    print("=" * 50)
    
    try:
        seed_demo_users()
        seed_demo_blood_units()
        
        print("\n" + "=" * 50)
        print("🎉 Demo data seeding completed successfully!")
        print("\n📱 You can now test the 3-POV demo system:")
        print("   • Hospital POV: apollo_hospital / hospital123")
        print("   • Blood Bank POV: chennai_blood_bank / bank123")
        print("   • Driver POV: demo_driver / driver123")
        print("   • Admin POV: admin / admin123")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")

if __name__ == '__main__':
    from src.main import app
    with app.app_context():
        main()
