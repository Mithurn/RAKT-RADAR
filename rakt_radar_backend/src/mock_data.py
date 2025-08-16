import random
from datetime import datetime, date, timedelta
from src.models.models import Hospital, BloodBank, BloodUnit, Transfer, db

# Configuration: Easy to change for different regions
# Current configuration: Tamil Nadu, India
# To deploy in another region, simply update these coordinates and names
REGION_CONFIG = {
    "name": "Tamil Nadu",
    "country": "India",
    "description": "Regional blood management network for Tamil Nadu hospitals and blood banks"
}

# Mock data for regional cities with approximate coordinates (currently configured for Tamil Nadu)
REGIONAL_CITIES = [
    {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707},
    {"city": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9558},
    {"city": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lng": 78.1198},
    {"city": "Salem", "state": "Tamil Nadu", "lat": 11.6643, "lng": 78.1460},
    {"city": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.7905, "lng": 78.7047},
    {"city": "Vellore", "state": "Tamil Nadu", "lat": 12.9716, "lng": 79.1596},
    {"city": "Erode", "state": "Tamil Nadu", "lat": 11.3410, "lng": 77.7172},
    {"city": "Tiruppur", "state": "Tamil Nadu", "lat": 11.1085, "lng": 77.3411},
    {"city": "Thoothukkudi", "state": "Tamil Nadu", "lat": 8.7642, "lng": 78.1348},
    {"city": "Vellore", "state": "Tamil Nadu", "lat": 12.9716, "lng": 79.1596},
    {"city": "Tirunelveli", "state": "Tamil Nadu", "lat": 8.7139, "lng": 77.7567},
    {"city": "Kanchipuram", "state": "Tamil Nadu", "lat": 12.8341, "lng": 79.7036},
    {"city": "Kumbakonam", "state": "Tamil Nadu", "lat": 10.9577, "lng": 79.3775},
    {"city": "Thanjavur", "state": "Tamil Nadu", "lat": 10.7905, "lng": 79.1375},
    {"city": "Namakkal", "state": "Tamil Nadu", "lat": 11.2213, "lng": 78.1652},
    {"city": "Karur", "state": "Tamil Nadu", "lat": 10.9577, "lng": 78.0809},
    {"city": "Dindigul", "state": "Tamil Nadu", "lat": 10.3629, "lng": 77.9754},
    {"city": "Sivakasi", "state": "Tamil Nadu", "lat": 9.4491, "lng": 77.7975},
    {"city": "Cuddalore", "state": "Tamil Nadu", "lat": 11.7456, "lng": 79.7633},
    {"city": "Villupuram", "state": "Tamil Nadu", "lat": 11.9394, "lng": 79.5376}
]

BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

# Regional hospital names (currently configured for Tamil Nadu)
REGIONAL_HOSPITAL_NAMES = [
    "Apollo Hospital", "Fortis Healthcare", "Max Healthcare", "AIIMS", "Manipal Hospital",
    "Narayana Health", "Medanta", "Kokilaben Hospital", "Lilavati Hospital", "Ruby Hall Clinic",
    "Chennai Medical College", "Madras Medical College", "Coimbatore Medical College", "Madurai Medical College",
    "Salem Government Hospital", "Vellore Medical Center", "Tiruchirappalli Medical College", "Erode Medical College",
    "Tiruppur Government Hospital", "Thoothukkudi Medical College", "Tirunelveli Medical College", "Kanchipuram Hospital",
    "Kumbakonam Medical Center", "Thanjavur Medical College", "Namakkal Government Hospital", "Karur Medical Center",
    "Dindigul Government Hospital", "Sivakasi Medical Center", "Cuddalore Government Hospital", "Villupuram Medical Center",
    "Sri Ramachandra Medical Centre", "Madras Medical Mission", "Kauvery Hospital", "Billroth Hospitals",
    "Chettinad Hospital", "MIOT International", "Global Hospitals", "Rainbow Children's Hospital",
    "SIMS Hospital", "Vijaya Hospital", "Sundaram Medical Foundation", "Adyar Cancer Institute",
    "Cancer Institute (WIA)", "Government General Hospital", "Government Royapettah Hospital", "Government Kilpauk Medical College"
]

# Regional blood bank names (currently configured for Tamil Nadu)
REGIONAL_BLOOD_BANK_NAMES = [
    "Chennai Central Blood Bank", "Red Cross Blood Bank Chennai", "Apollo Blood Bank", "Fortis Blood Bank",
    "Coimbatore Central Blood Bank", "Madurai Blood Center", "Salem Blood Bank", "Vellore Blood Center",
    "Tiruchirappalli Blood Bank", "Erode Blood Center", "Tiruppur Blood Bank", "Thoothukkudi Blood Center",
    "Tirunelveli Blood Bank", "Kanchipuram Blood Center", "Kumbakonam Blood Bank", "Thanjavur Blood Center",
    "Namakkal Blood Bank", "Karur Blood Center", "Dindigul Blood Bank", "Sivakasi Blood Center",
    "Cuddalore Blood Bank", "Villupuram Blood Center", "Life Saver Blood Bank", "Hope Blood Bank",
    "Unity Blood Center", "Care Blood Bank", "Metro Blood Services", "Community Blood Bank",
    "Regional Blood Center", "City Blood Center", "Emergency Blood Bank", "Trauma Blood Center",
    "Pediatric Blood Bank", "Cancer Blood Bank", "Transplant Blood Bank", "Emergency Response Blood Bank"
]

def generate_mock_hospitals(count=25):
    """Generate mock hospital data for regional network (currently Tamil Nadu)"""
    hospitals = []
    
    for i in range(count):
        city_data = random.choice(REGIONAL_CITIES)
        # Add some random variation to coordinates
        lat_variation = random.uniform(-0.05, 0.05)  # Smaller variation for closer distances
        lng_variation = random.uniform(-0.05, 0.05)
        
        hospital = Hospital(
            name=f"{random.choice(REGIONAL_HOSPITAL_NAMES)} {city_data['city']} {i+1}",
            address=f"{random.randint(1, 999)} Medical Street, {city_data['city']}",
            city=city_data['city'],
            state=city_data['state'],
            latitude=city_data['lat'] + lat_variation,
            longitude=city_data['lng'] + lng_variation,
            contact_person=f"Dr. {random.choice(['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Raj', 'Krishna', 'Venkat', 'Raman', 'Sundar'])}",
            contact_email=f"contact.hospital{i+1}@{city_data['city'].lower()}.com",
            contact_phone=f"+91{random.randint(7000000000, 9999999999)}"
        )
        hospitals.append(hospital)
    
    return hospitals

def generate_mock_blood_banks(count=20):
    """Generate mock blood bank data for regional network (currently Tamil Nadu)"""
    blood_banks = []
    
    for i in range(count):
        city_data = random.choice(REGIONAL_CITIES)
        # Add some random variation to coordinates
        lat_variation = random.uniform(-0.05, 0.05)  # Smaller variation for closer distances
        lng_variation = random.uniform(-0.05, 0.05)
        
        blood_bank = BloodBank(
            name=f"{random.choice(REGIONAL_BLOOD_BANK_NAMES)} {city_data['city']} {1}",
            address=f"{random.randint(1, 999)} Blood Bank Road, {city_data['city']}",
            city=city_data['city'],
            state=city_data['state'],
            latitude=city_data['lat'] + lat_variation,
            longitude=city_data['lng'] + lng_variation,
            contact_person=f"Mr. {random.choice(['Agarwal', 'Jain', 'Verma', 'Yadav', 'Mishra', 'Raj', 'Krishna', 'Venkat', 'Raman', 'Sundar'])}",
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
    hospitals = generate_mock_hospitals(25)
    for hospital in hospitals:
        db.session.add(hospital)
    
    # Generate blood banks
    blood_banks = generate_mock_blood_banks(20)
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
    
    print(f"\nRegion Configuration:")
    print(f"- Region: {REGION_CONFIG['name']}")
    print(f"- Country: {REGION_CONFIG['country']}")
    print(f"- Description: {REGION_CONFIG['description']}")


# Configuration Instructions:
# To deploy this system in a different region:
# 1. Update REGION_CONFIG above with new region details
# 2. Replace REGIONAL_CITIES with coordinates for your target cities
# 3. Update REGIONAL_HOSPITAL_NAMES with local hospital names
# 4. Update REGIONAL_BLOOD_BANK_NAMES with local blood bank names
# 5. Adjust coordinate variations in generate_mock_hospitals() and generate_mock_blood_banks()
# 6. The frontend will automatically adapt to show "Local Network" instead of region-specific text

