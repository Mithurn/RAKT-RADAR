# Region Configuration File for RAKT-RADAR
# Easy deployment configuration for different regions

# Current Region: Tamil Nadu, India
# To deploy in another region, update this configuration

REGION_CONFIG = {
    "name": "Tamil Nadu",
    "country": "India",
    "description": "Regional blood management network for Tamil Nadu hospitals and blood banks",
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "language": "en",
    "emergency_number": "+91-100",
    "blood_bank_helpline": "+91-104"
}

# City configurations with coordinates
CITIES = {
    "tamil_nadu": [
        {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707},
        {"city": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9558},
        {"city": "Madurai", "state": "Tamil Nadu", "lat": 9.9252, "lng": 78.1198},
        {"city": "Salem", "state": "Tamil Nadu", "lat": 11.6643, "lng": 78.1460},
        {"city": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.7905, "lng": 78.7047},
        {"city": "Vellore", "state": "Tamil Nadu", "lat": 12.9716, "lng": 79.1596},
        {"city": "Erode", "state": "Tamil Nadu", "lat": 11.3410, "lng": 77.7172},
        {"city": "Tiruppur", "state": "Tamil Nadu", "lat": 11.1085, "lng": 77.3411},
        {"city": "Thoothukkudi", "state": "Tamil Nadu", "lat": 8.7642, "lng": 78.1348},
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
    ],
    
    # Example: Maharashtra, India
    "maharashtra": [
        {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777},
        {"city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
        {"city": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882},
        {"city": "Thane", "state": "Maharashtra", "lat": 19.2183, "lng": 72.9781},
        {"city": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898}
    ],
    
    # Example: Karnataka, India
    "karnataka": [
        {"city": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946},
        {"city": "Mysore", "state": "Karnataka", "lat": 12.2958, "lng": 76.6394},
        {"city": "Mangalore", "state": "Karnataka", "lat": 12.9141, "lng": 74.8560},
        {"city": "Hubli", "state": "Karnataka", "lat": 15.3647, "lng": 75.1240},
        {"city": "Belgaum", "state": "Karnataka", "lat": 15.8497, "lng": 74.4977}
    ]
}

# Hospital name templates by region
HOSPITAL_NAMES = {
    "tamil_nadu": [
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
    ],
    
    "maharashtra": [
        "Apollo Hospital", "Fortis Healthcare", "Max Healthcare", "AIIMS", "Manipal Hospital",
        "Narayana Health", "Medanta", "Kokilaben Hospital", "Lilavati Hospital", "Ruby Hall Clinic",
        "Bombay Hospital", "Jaslok Hospital", "Breach Candy Hospital", "Sion Hospital", "KEM Hospital",
        "JJ Hospital", "St. George's Hospital", "GT Hospital", "Cama Hospital", "Wadia Hospital"
    ],
    
    "karnataka": [
        "Apollo Hospital", "Fortis Healthcare", "Max Healthcare", "AIIMS", "Manipal Hospital",
        "Narayana Health", "Medanta", "Kokilaben Hospital", "Lilavati Hospital", "Ruby Hall Clinic",
        "Victoria Hospital", "Bowring Hospital", "KC General Hospital", "Vani Vilas Hospital", "Minto Hospital",
        "SDS Tuberculosis Sanatorium", "Kidwai Memorial Institute", "NIMHANS", "St. John's Hospital", "Sparsh Hospital"
    ]
}

# Blood bank name templates by region
BLOOD_BANK_NAMES = {
    "tamil_nadu": [
        "Chennai Central Blood Bank", "Red Cross Blood Bank Chennai", "Apollo Blood Bank", "Fortis Blood Bank",
        "Coimbatore Central Blood Bank", "Madurai Blood Center", "Salem Blood Bank", "Vellore Blood Center",
        "Tiruchirappalli Blood Bank", "Erode Blood Center", "Tiruppur Blood Bank", "Thoothukkudi Blood Center",
        "Tirunelveli Blood Bank", "Kanchipuram Blood Center", "Kumbakonam Blood Bank", "Thanjavur Blood Center",
        "Namakkal Blood Bank", "Karur Blood Center", "Dindigul Blood Bank", "Sivakasi Blood Center",
        "Cuddalore Blood Bank", "Villupuram Blood Center", "Life Saver Blood Bank", "Hope Blood Bank",
        "Unity Blood Center", "Care Blood Bank", "Metro Blood Services", "Community Blood Bank",
        "Regional Blood Center", "City Blood Center", "Emergency Blood Bank", "Trauma Blood Center",
        "Pediatric Blood Bank", "Cancer Blood Bank", "Transplant Blood Bank", "Emergency Response Blood Bank"
    ],
    
    "maharashtra": [
        "Mumbai Central Blood Bank", "Red Cross Blood Bank Mumbai", "Apollo Blood Bank", "Fortis Blood Bank",
        "Pune Blood Center", "Nagpur Blood Bank", "Thane Blood Center", "Nashik Blood Bank",
        "Life Saver Blood Bank", "Hope Blood Bank", "Unity Blood Center", "Care Blood Bank",
        "Metro Blood Services", "Community Blood Bank", "Regional Blood Center", "City Blood Center"
    ],
    
    "karnataka": [
        "Bangalore Central Blood Bank", "Red Cross Blood Bank Bangalore", "Apollo Blood Bank", "Fortis Blood Bank",
        "Mysore Blood Center", "Mangalore Blood Bank", "Hubli Blood Center", "Belgaum Blood Bank",
        "Life Saver Blood Bank", "Hope Blood Bank", "Unity Blood Center", "Care Blood Bank",
        "Metro Blood Services", "Community Blood Bank", "Regional Blood Center", "City Blood Center"
    ]
}

# Current active region
ACTIVE_REGION = "tamil_nadu"

def get_current_region_config():
    """Get configuration for the currently active region"""
    return {
        "config": REGION_CONFIG,
        "cities": CITIES[ACTIVE_REGION],
        "hospitals": HOSPITAL_NAMES[ACTIVE_REGION],
        "blood_banks": BLOOD_BANK_NAMES[ACTIVE_REGION]
    }

def switch_region(region_key):
    """Switch to a different region configuration"""
    global ACTIVE_REGION
    if region_key in CITIES:
        ACTIVE_REGION = region_key
        return True
    return False

def get_available_regions():
    """Get list of available regions"""
    return list(CITIES.keys())

# Usage example:
# To switch to Maharashtra: switch_region("maharashtra")
# To get current config: get_current_region_config()
