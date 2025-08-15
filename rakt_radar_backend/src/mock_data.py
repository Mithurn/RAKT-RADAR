import random
from datetime import datetime, date, timedelta
from src.models.models import Hospital, BloodBank, BloodUnit, Transfer, db

# Mock data for Indian cities with approximate coordinates
INDIAN_CITIES = [
    {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777},
    {"city": "Delhi", "state": "Delhi", "lat": 28.7041, "lng": 77.1025},
    {"city": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946},
    {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707},
    {"city": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lng": 88.3639},
    {"city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867},
    {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
    {"city": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lng": 72.5714},
    {"city": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873},
    {"city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462}
]

BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

HOSPITAL_NAMES = [
    "Apollo Hospital", "Fortis Healthcare", "Max Healthcare", "AIIMS", "Manipal Hospital",
    "Narayana Health", "Medanta", "Kokilaben Hospital", "Lilavati Hospital", "Ruby Hall Clinic"
]

BLOOD_BANK_NAMES = [
    "Red Cross Blood Bank", "Central Blood Bank", "City Blood Center", "Life Saver Blood Bank",
    "Hope Blood Bank", "Unity Blood Center", "Care Blood Bank", "Metro Blood Services",
    "Community Blood Bank", "Regional Blood Center"
]

def generate_mock_hospitals(count=10):
    """Generate mock hospital data"""
    hospitals = []
    
    for i in range(count):
        city_data = random.choice(INDIAN_CITIES)
        # Add some random variation to coordinates
        lat_variation = random.uniform(-0.1, 0.1)
        lng_variation = random.uniform(-0.1, 0.1)
        
        hospital = Hospital(
            name=f"{random.choice(HOSPITAL_NAMES)} {city_data['city']} {i+1}",
            address=f"{random.randint(1, 999)} Medical Street, {city_data['city']}",
            city=city_data['city'],
            state=city_data['state'],
            latitude=city_data['lat'] + lat_variation,
            longitude=city_data['lng'] + lng_variation,
            contact_person=f"Dr. {random.choice(['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta'])}",
            contact_email=f"contact.hospital{i+1}@{city_data['city'].lower()}.com",
            contact_phone=f"+91{random.randint(7000000000, 9999999999)}"
        )
        hospitals.append(hospital)
    
    return hospitals

def generate_mock_blood_banks(count=8):
    """Generate mock blood bank data"""
    blood_banks = []
    
    for i in range(count):
        city_data = random.choice(INDIAN_CITIES)
        # Add some random variation to coordinates
        lat_variation = random.uniform(-0.1, 0.1)
        lng_variation = random.uniform(-0.1, 0.1)
        
        blood_bank = BloodBank(
            name=f"{random.choice(BLOOD_BANK_NAMES)} {city_data['city']} {i+1}",
            address=f"{random.randint(1, 999)} Blood Bank Road, {city_data['city']}",
            city=city_data['city'],
            state=city_data['state'],
            latitude=city_data['lat'] + lat_variation,
            longitude=city_data['lng'] + lng_variation,
            contact_person=f"Mr. {random.choice(['Agarwal', 'Jain', 'Verma', 'Yadav', 'Mishra'])}",
            contact_email=f"manager.bloodbank{i+1}@{city_data['city'].lower()}.com",
            contact_phone=f"+91{random.randint(7000000000, 9999999999)}"
        )
        blood_banks.append(blood_bank)
    
    return blood_banks

def generate_mock_blood_units(blood_banks, count=50):
    """Generate mock blood unit data"""
    blood_units = []
    
    for i in range(count):
        blood_bank = random.choice(blood_banks)
        
        # Generate collection date (1-30 days ago)
        collection_date = date.today() - timedelta(days=random.randint(1, 30))
        
        # Generate expiry date (35 days from collection, with some variation)
        expiry_date = collection_date + timedelta(days=random.randint(30, 42))
        
        # Check if unit should be flagged for expiry (within 7 days)
        days_until_expiry = (expiry_date - date.today()).days
        is_flagged = days_until_expiry <= 7 and days_until_expiry > 0
        
        # Determine status
        if days_until_expiry <= 0:
            status = 'expired'
        elif random.random() < 0.1:  # 10% chance of being transferred
            status = 'transferred'
        else:
            status = 'available'
        
        blood_unit = BloodUnit(
            blood_bank_id=blood_bank.id,
            blood_type=random.choice(BLOOD_TYPES),
            quantity_ml=random.choice([350, 450, 500]),  # Standard blood unit sizes
            collection_date=collection_date,
            expiry_date=expiry_date,
            status=status,
            is_flagged_for_expiry=is_flagged,
            current_location_latitude=blood_bank.latitude,
            current_location_longitude=blood_bank.longitude
        )
        blood_units.append(blood_unit)
    
    return blood_units

def generate_mock_transfers(blood_units, hospitals, blood_banks, count=15):
    """Generate mock transfer data"""
    transfers = []
    
    # Get transferred blood units
    transferred_units = [unit for unit in blood_units if unit.status == 'transferred']
    
    for i in range(min(count, len(transferred_units))):
        blood_unit = transferred_units[i]
        
        # Random from entity (blood bank)
        from_entity = random.choice(blood_banks)
        
        # Random to entity (hospital or another blood bank)
        to_entity = random.choice(hospitals + blood_banks)
        
        # Ensure from and to are different
        while to_entity.id == from_entity.id:
            to_entity = random.choice(hospitals + blood_banks)
        
        transfer_date = datetime.now() - timedelta(days=random.randint(1, 10))
        
        transfer = Transfer(
            blood_unit_id=blood_unit.id,
            from_entity_id=from_entity.id,
            to_entity_id=to_entity.id,
            transfer_date=transfer_date,
            status=random.choice(['completed', 'pending']),
            notes=f"Emergency transfer for {blood_unit.blood_type} blood type"
        )
        transfers.append(transfer)
    
    return transfers

def populate_mock_data():
    """Populate the database with mock data"""
    print("Generating mock data...")
    
    # Generate hospitals
    hospitals = generate_mock_hospitals(10)
    for hospital in hospitals:
        db.session.add(hospital)
    
    # Generate blood banks
    blood_banks = generate_mock_blood_banks(8)
    for blood_bank in blood_banks:
        db.session.add(blood_bank)
    
    # Commit to get IDs
    db.session.commit()
    
    # Generate blood units
    blood_units = generate_mock_blood_units(blood_banks, 50)
    for blood_unit in blood_units:
        db.session.add(blood_unit)
    
    # Commit to get blood unit IDs
    db.session.commit()
    
    # Generate transfers
    transfers = generate_mock_transfers(blood_units, hospitals, blood_banks, 15)
    for transfer in transfers:
        db.session.add(transfer)
    
    # Final commit
    db.session.commit()
    
    print(f"Mock data generated successfully!")
    print(f"- {len(hospitals)} hospitals")
    print(f"- {len(blood_banks)} blood banks")
    print(f"- {len(blood_units)} blood units")
    print(f"- {len(transfers)} transfers")
    
    # Print some statistics
    flagged_units = [unit for unit in blood_units if unit.is_flagged_for_expiry]
    expired_units = [unit for unit in blood_units if unit.status == 'expired']
    available_units = [unit for unit in blood_units if unit.status == 'available']
    
    print(f"\nBlood Unit Statistics:")
    print(f"- Available units: {len(available_units)}")
    print(f"- Flagged for expiry: {len(flagged_units)}")
    print(f"- Expired units: {len(expired_units)}")
    print(f"- Transferred units: {len([unit for unit in blood_units if unit.status == 'transferred'])}")

