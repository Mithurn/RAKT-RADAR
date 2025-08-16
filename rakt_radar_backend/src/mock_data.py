import random
from datetime import datetime, date, timedelta
from src.models.models import Hospital, BloodBank, BloodUnit, Transfer, db

# Configuration: Tamil Nadu Focus - Diverse Blood Bank Network
REGION_CONFIG = {
    "name": "Tamil Nadu",
    "country": "India",
    "description": "Comprehensive Blood Management Network for Tamil Nadu",
    "main_hospital": "Apollo Hospitals Chennai"
}

# Major Tamil Nadu cities with accurate coordinates (focusing on areas around Chennai)
TAMIL_NADU_CITIES = [
    {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707, "region": "Chennai Metro"},
    {"city": "Chengalpattu", "state": "Tamil Nadu", "lat": 12.6975, "lng": 79.9876, "region": "Chennai Metro"},
    {"city": "Kanchipuram", "state": "Tamil Nadu", "lat": 12.8341, "lng": 79.7036, "region": "Chennai Metro"},
    {"city": "Tiruvallur", "state": "Tamil Nadu", "lat": 13.1371, "lng": 79.9022, "region": "Chennai Metro"},
    {"city": "Vellore", "state": "Tamil Nadu", "lat": 12.9716, "lng": 79.1596, "region": "Vellore District"},
    {"city": "Kanchipuram", "state": "Tamil Nadu", "lat": 12.8341, "lng": 79.7036, "region": "Kanchipuram District"},
    {"city": "Tiruvannamalai", "state": "Tamil Nadu", "lat": 12.2319, "lng": 79.0675, "region": "Tiruvannamalai District"},
    {"city": "Salem", "state": "Tamil Nadu", "lat": 11.6643, "lng": 78.1460, "region": "Salem District"},
    {"city": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9558, "region": "Coimbatore District"},
    {"city": "Erode", "state": "Tamil Nadu", "lat": 11.3410, "lng": 77.7172, "region": "Erode District"},
    {"city": "Tiruppur", "state": "Tamil Nadu", "lat": 11.1085, "lng": 77.3411, "region": "Tiruppur District"},
    {"city": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lng": 78.1198, "region": "Madurai District"},
    {"city": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.7905, "lng": 78.7047, "region": "Tiruchirappalli District"},
    {"city": "Thanjavur", "state": "Tamil Nadu", "lat": 10.7905, "lng": 79.1375, "region": "Thanjavur District"},
    {"city": "Kumbakonam", "state": "Tamil Nadu", "lat": 10.9577, "lng": 79.3775, "region": "Thanjavur District"},
    {"city": "Nagapattinam", "state": "Tamil Nadu", "lat": 10.7633, "lng": 79.8431, "region": "Nagapattinam District"},
    {"city": "Karaikal", "state": "Puducherry", "lat": 10.9254, "lng": 79.8380, "region": "Puducherry"},
    {"city": "Cuddalore", "state": "Tamil Nadu", "lat": 11.7456, "lng": 79.7633, "region": "Cuddalore District"},
    {"city": "Villupuram", "state": "Tamil Nadu", "lat": 11.9394, "lng": 79.5376, "region": "Villupuram District"},
    {"city": "Tirunelveli", "state": "Tamil Nadu", "lat": 8.7139, "lng": 77.7567, "region": "Tirunelveli District"},
    {"city": "Thoothukkudi", "state": "Tamil Nadu", "lat": 8.7642, "lng": 78.1348, "region": "Thoothukkudi District"},
    {"city": "Nagercoil", "state": "Tamil Nadu", "lat": 8.1833, "lng": 77.4119, "region": "Kanyakumari District"}
]

BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

# Tamil Nadu specific hospital names (focusing on major hospitals)
TAMIL_NADU_HOSPITAL_NAMES = [
    # Major Chennai Hospitals
    "Apollo Hospitals Chennai", "Fortis Malar Hospital", "MIOT International",
    "Global Hospitals Chennai", "Kauvery Hospital", "Billroth Hospitals", "Chettinad Hospital",
    "SIMS Hospital", "Vijaya Hospital", "Sundaram Medical Foundation", "Adyar Cancer Institute",
    "Cancer Institute (WIA)", "Government General Hospital", "Government Royapettah Hospital",
    "Government Kilpauk Medical College", "Madras Medical College", "Sri Ramachandra Medical Centre",
    "Madras Medical Mission", "Rainbow Children's Hospital", "Chennai Medical College",
    
    # Other District Hospitals
    "Coimbatore Medical College", "Madurai Medical College", "Salem Government Hospital", 
    "Vellore Medical Center", "Tiruchirappalli Medical College", "Erode Medical College",
    "Tiruppur Government Hospital", "Thoothukkudi Medical College", "Tirunelveli Medical College",
    "Kanchipuram Government Hospital", "Kumbakonam Medical Center", "Thanjavur Medical College",
    "Namakkal Government Hospital", "Karur Medical Center", "Dindigul Government Hospital",
    "Sivakasi Medical Center", "Cuddalore Government Hospital", "Villupuram Medical Center",
    "Nagapattinam Government Hospital", "Nagercoil Medical Center"
]

# Additional diverse hospital names for more variety
ADDITIONAL_HOSPITAL_NAMES = [
    "Tamil Nadu Regional Medical Center", "Chennai Metro Hospital", "Southern Medical Network",
    "Chennai Emergency Medical Center", "Tamil Nadu Medical Center", "Chennai Community Hospital",
    "Tamil Nadu Medical Services", "Chennai Hospital Network", "Tamil Nadu Emergency Hospital",
    "Chennai Regional Medical Center", "Tamil Nadu Central Hospital", "Chennai Medical Services",
    "Tamil Nadu Medical Network", "Chennai Emergency Medical Services", "Tamil Nadu Medical Donation Center",
    "Chennai Regional Hospital", "Tamil Nadu Medical Center Network", "Chennai Community Medical Services",
    "Tamil Nadu Hospital Network", "Chennai Emergency Hospital Network", "Tamil Nadu Medical Center Services",
    "Chennai Metropolitan Medical Center", "Tamil Nadu State Medical Center", "Chennai Urban Medical Services",
    "Tamil Nadu Regional Medical Services", "Chennai District Medical Center", "Tamil Nadu Central Medical Services",
    "Chennai Emergency Medical Network", "Tamil Nadu Medical Donation Network", "Chennai Regional Medical Network",
    "Tamil Nadu Medical Services Network", "Chennai Community Medical Network", "Tamil Nadu Medical Center Network",
    "Chennai Metropolitan Medical Services", "Tamil Nadu State Medical Services", "Chennai Urban Medical Network"
]

# Tamil Nadu specific blood bank names
TAMIL_NADU_BLOOD_BANK_NAMES = [
    # Chennai Blood Banks
    "Chennai Central Blood Bank", "Red Cross Blood Bank Chennai", "Apollo Blood Bank Chennai",
    "Fortis Blood Bank Chennai", "MIOT Blood Center", "Global Blood Bank Chennai",
    "Kauvery Blood Bank", "Billroth Blood Bank", "Chettinad Blood Bank", "SIMS Blood Bank",
    "Vijaya Blood Bank", "Sundaram Blood Bank", "Adyar Blood Center", "Cancer Institute Blood Bank",
    "Government Blood Bank Chennai", "Madras Medical College Blood Bank", "Ramachandra Blood Bank",
    "Madras Medical Mission Blood Bank", "Rainbow Blood Bank", "Chennai Medical College Blood Bank",
    
    # Other District Blood Banks
    "Coimbatore Central Blood Bank", "Madurai Blood Center", "Salem Blood Bank", "Vellore Blood Center",
    "Tiruchirappalli Blood Bank", "Erode Blood Center", "Tiruppur Blood Bank", "Thoothukkudi Blood Center",
    "Tirunelveli Blood Bank", "Kanchipuram Blood Center", "Kumbakonam Blood Bank", "Thanjavur Blood Center",
    "Namakkal Blood Bank", "Karur Blood Center", "Dindigul Blood Bank", "Sivakasi Blood Center",
    "Cuddalore Blood Bank", "Villupuram Blood Center", "Nagapattinam Blood Bank", "Nagercoil Blood Center"
]

# Additional diverse blood bank names for more variety
ADDITIONAL_BLOOD_BANK_NAMES = [
    "Tamil Nadu Regional Blood Center", "Chennai Metro Blood Services", "Southern Blood Bank Network",
    "Chennai Emergency Blood Center", "Tamil Nadu Blood Donation Center", "Chennai Community Blood Bank",
    "Tamil Nadu Medical Blood Services", "Chennai Hospital Blood Center", "Tamil Nadu Emergency Blood Bank",
    "Chennai Regional Blood Services", "Tamil Nadu Central Blood Center", "Chennai Medical Blood Bank",
    "Tamil Nadu Blood Services", "Chennai Emergency Blood Services", "Tamil Nadu Blood Donation Services",
    "Chennai Regional Blood Center", "Tamil Nadu Medical Blood Center", "Chennai Community Blood Services",
    "Tamil Nadu Blood Network", "Chennai Emergency Blood Network", "Tamil Nadu Blood Center Network",
    "Chennai Metropolitan Blood Bank", "Tamil Nadu State Blood Center", "Chennai Urban Blood Services",
    "Tamil Nadu Regional Blood Services", "Chennai District Blood Center", "Tamil Nadu Central Blood Services",
    "Chennai Emergency Blood Network", "Tamil Nadu Blood Donation Network", "Chennai Regional Blood Network",
    "Tamil Nadu Medical Blood Network", "Chennai Community Blood Network", "Tamil Nadu Blood Services Network",
    "Chennai Metropolitan Blood Services", "Tamil Nadu State Blood Services", "Chennai Urban Blood Network"
]

def generate_mock_hospitals(count=40):
    """Generate mock hospital data for Tamil Nadu network - Evenly distributed"""
    hospitals = []
    
    # Generate diverse hospitals across Tamil Nadu (no SRM Global Hospitals bias)
    for i in range(count):
        city_data = random.choice(TAMIL_NADU_CITIES)
        # Add realistic variation to coordinates (within city limits)
        lat_variation = random.uniform(-0.02, 0.02)  # Smaller variation for realistic city distances
        lng_variation = random.uniform(-0.02, 0.02)
        
        # Use a mix of predefined names and generated names for more variety
        if random.random() < 0.6:  # 60% chance of using predefined names
            used_names = [h.name for h in hospitals]
            available_names = [name for name in TAMIL_NADU_HOSPITAL_NAMES if name not in used_names]
            
            if not available_names:
                available_names = TAMIL_NADU_HOSPITAL_NAMES
            
            hospital_name = f"{random.choice(available_names)} {city_data['city']}"
        else:  # 40% chance of using additional diverse names
            used_names = [h.name for h in hospitals]
            available_names = [name for name in ADDITIONAL_HOSPITAL_NAMES if name not in used_names]
            
            if not available_names:
                available_names = ADDITIONAL_HOSPITAL_NAMES
            
            hospital_name = f"{random.choice(available_names)} {city_data['city']}"
        
        hospital = Hospital(
            name=hospital_name,
            address=f"{random.randint(1, 999)} Medical Street, {city_data['city']}, {city_data['state']}",
            city=city_data['city'],
            state=city_data['state'],
            latitude=city_data['lat'] + lat_variation,
            longitude=city_data['lng'] + lng_variation,
            contact_person=f"Dr. {random.choice(['Venkat', 'Raman', 'Sundar', 'Krishna', 'Raj', 'Kumar', 'Sharma', 'Patel', 'Singh', 'Gupta'])}",
            contact_email=f"hospital.{city_data['city'].lower().replace(' ', '')}{i+1}@tamilnadu.com",
            contact_phone=f"+91{random.randint(7000000000, 9999999999)}"
        )
        hospitals.append(hospital)
    
    return hospitals

def generate_mock_blood_banks(count=35):
    """Generate mock blood bank data for Tamil Nadu network - No SRM Blood Bank"""
    blood_banks = []
    
    # Generate diverse blood banks across Tamil Nadu (no SRM Blood Bank)
    for i in range(count):
        city_data = random.choice(TAMIL_NADU_CITIES)
        # Add realistic variation to coordinates
        lat_variation = random.uniform(-0.02, 0.02)
        lng_variation = random.uniform(-0.02, 0.02)
        
        # Use a mix of predefined names and generated names for more variety
        if random.random() < 0.6:  # 60% chance of using predefined names
            used_names = [b.name for b in blood_banks]
            available_names = [name for name in TAMIL_NADU_BLOOD_BANK_NAMES if name not in used_names]
            
            if not available_names:
                available_names = TAMIL_NADU_BLOOD_BANK_NAMES
            
            blood_bank_name = f"{random.choice(available_names)} {city_data['city']}"
        else:  # 40% chance of using additional diverse names
            used_names = [b.name for b in blood_banks]
            available_names = [name for name in ADDITIONAL_BLOOD_BANK_NAMES if name not in used_names]
            
            if not available_names:
                available_names = ADDITIONAL_BLOOD_BANK_NAMES
            
            blood_bank_name = f"{random.choice(available_names)} {city_data['city']}"
        
        blood_bank = BloodBank(
            name=blood_bank_name,
            address=f"{random.randint(1, 999)} Blood Bank Street, {city_data['city']}, {city_data['state']}",
            city=city_data['city'],
            state=city_data['state'],
            latitude=city_data['lat'] + lat_variation,
            longitude=city_data['lng'] + lng_variation,
            contact_person=f"Dr. {random.choice(['Venkat', 'Raman', 'Sundar', 'Krishna', 'Raj', 'Kumar', 'Sharma', 'Patel', 'Singh', 'Gupta'])}",
            contact_email=f"bloodbank.{city_data['city'].lower().replace(' ', '')}{i+1}@tamilnadu.com",
            contact_phone=f"+91{random.randint(7000000000, 9999999999)}"
        )
        blood_banks.append(blood_bank)
    
    return blood_banks

def generate_mock_blood_units(blood_banks, count=80):
    """Generate mock blood unit data for Tamil Nadu network - Evenly distributed"""
    blood_units = []
    
    for i in range(count):
        # Evenly distribute blood units across all blood banks (no bias)
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
        elif random.random() < 0.15:  # 15% chance of being transferred
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

def generate_mock_transfers(blood_units, hospitals, blood_banks, count=20):
    """Generate mock transfer data for Tamil Nadu network - Evenly distributed"""
    transfers = []
    
    # Get transferred blood units
    transferred_units = [unit for unit in blood_units if unit.status == 'transferred']
    
    for i in range(min(count, len(transferred_units))):
        blood_unit = transferred_units[i]
        
        # Evenly distribute transfers across all blood banks (no bias)
        from_entity = random.choice(blood_banks)
        
        # Random to entity (hospital or another blood bank)
        to_entity = random.choice(hospitals + blood_banks)
        
        # Ensure from and to are different
        while to_entity.id == from_entity.id:
            to_entity = random.choice(hospitals + blood_banks)
        
        transfer_date = datetime.now() - timedelta(days=random.randint(1, 10))
        
        # Generate realistic transfer notes for Tamil Nadu context
        transfer_notes = [
            f"Emergency transfer for {blood_unit.blood_type} blood type - Tamil Nadu Regional Network",
            f"Critical blood requirement at {to_entity.city} - {blood_unit.blood_type} blood",
            f"Regional blood shortage response - {blood_unit.blood_type} blood transfer",
            f"Emergency blood request from {to_entity.city} - {blood_unit.blood_type} blood",
            f"Tamil Nadu blood network coordination - {blood_unit.blood_type} blood transfer"
        ]
        
        transfer = Transfer(
            blood_unit_id=blood_unit.id,
            from_entity_id=from_entity.id,
            to_entity_id=to_entity.id,
            transfer_date=transfer_date,
            status=random.choice(['completed', 'pending']),
            notes=random.choice(transfer_notes)
        )
        transfers.append(transfer)
    
    return transfers

def populate_mock_data():
    """Populate the database with mock data"""
    print("Generating mock data...")
    
    # Generate hospitals
    hospitals = generate_mock_hospitals(40)  # Increased from 30 to 40
    for hospital in hospitals:
        db.session.add(hospital)
    
    # Generate blood banks
    blood_banks = generate_mock_blood_banks(35)
    for blood_bank in blood_banks:
        db.session.add(blood_bank)
    
    # Commit to get IDs
    db.session.commit()
    
    # Generate blood units
    blood_units = generate_mock_blood_units(blood_banks, 120)  # Increased from 80 to 120
    for blood_unit in blood_units:
        db.session.add(blood_unit)
    
    # Commit to get blood unit IDs
    db.session.commit()
    
    # Generate transfers
    transfers = generate_mock_transfers(blood_units, hospitals, blood_banks, 20)
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
    print(f"- Main Hospital: {REGION_CONFIG['main_hospital']}")


# Configuration Instructions:
# To deploy this system in a different region:
# 1. Update REGION_CONFIG above with new region details
# 2. Replace TAMIL_NADU_CITIES with coordinates for your target cities
# 3. Update TAMIL_NADU_HOSPITAL_NAMES with local hospital names
# 4. Update TAMIL_NADU_BLOOD_BANK_NAMES with local blood bank names
# 5. Adjust coordinate variations in generate_mock_hospitals() and generate_mock_blood_banks()
# 6. The frontend will automatically adapt to show "Local Network" instead of region-specific text

