# RAKT-RADAR Region Deployment Guide

## Overview
RAKT-RADAR is designed to be a scalable, region-agnostic blood management system. While it's currently configured for Tamil Nadu, India, it can be easily deployed in any region worldwide.

## Key Benefits of Regional Deployment

1. **Distance Optimization**: The system calculates optimal routes based on local coordinates, ensuring faster response times
2. **Local Network Focus**: Hospitals and blood banks are grouped by region for efficient resource management
3. **Scalable Architecture**: Frontend automatically adapts to show "Local Network" instead of region-specific text
4. **Easy Configuration**: Simple configuration files make region switching straightforward

## Current Configuration: Tamil Nadu, India

The system is currently configured with:
- **25 hospitals** across 20 cities in Tamil Nadu
- **20 blood banks** strategically located throughout the region
- **Optimized coordinates** for accurate distance calculations
- **Local hospital names** relevant to the region

## How to Deploy in a New Region

### Step 1: Update Region Configuration

Edit `rakt_radar_backend/region_config.py`:

```python
# Change the active region
ACTIVE_REGION = "your_region_key"

# Update region details
REGION_CONFIG = {
    "name": "Your Region Name",
    "country": "Your Country",
    "description": "Description of your regional network",
    "timezone": "Your/Timezone",
    "currency": "Your Currency Code",
    "language": "en",
    "emergency_number": "Your Emergency Number",
    "blood_bank_helpline": "Your Blood Bank Helpline"
}
```

### Step 2: Add Your Cities

Add your cities with accurate coordinates:

```python
CITIES = {
    "your_region_key": [
        {"city": "City Name", "state": "State/Province", "lat": latitude, "lng": longitude},
        # Add more cities...
    ]
}
```

### Step 3: Customize Hospital Names

Add local hospital names:

```python
HOSPITAL_NAMES = {
    "your_region_key": [
        "Local Hospital 1",
        "Regional Medical Center",
        "City General Hospital",
        # Add more hospitals...
    ]
}
```

### Step 4: Customize Blood Bank Names

Add local blood bank names:

```python
BLOOD_BANK_NAMES = {
    "your_region_key": [
        "City Central Blood Bank",
        "Regional Blood Center",
        "Emergency Blood Bank",
        # Add more blood banks...
    ]
}
```

### Step 5: Update Mock Data

Edit `rakt_radar_backend/src/mock_data.py` to use the new configuration:

```python
from region_config import get_current_region_config

# Get current region data
region_data = get_current_region_config()
REGIONAL_CITIES = region_data["cities"]
REGIONAL_HOSPITAL_NAMES = region_data["hospitals"]
REGIONAL_BLOOD_BANK_NAMES = region_data["blood_banks"]
```

## Example: Deploying in Maharashtra, India

```python
# Switch to Maharashtra
switch_region("maharashtra")

# The system will now use:
# - Cities: Mumbai, Pune, Nagpur, Thane, Nashik
# - Hospital names: Bombay Hospital, Jaslok Hospital, etc.
# - Blood bank names: Mumbai Central Blood Bank, etc.
```

## Example: Deploying in Karnataka, India

```python
# Switch to Karnataka
switch_region("karnataka")

# The system will now use:
# - Cities: Bangalore, Mysore, Mangalore, Hubli, Belgaum
# - Hospital names: Victoria Hospital, Bowring Hospital, etc.
# - Blood bank names: Bangalore Central Blood Bank, etc.
```

## Frontend Adaptation

The frontend automatically adapts to show:
- "Local Network" instead of region-specific text
- "Regional transfers" instead of "Tamil Nadu transfers"
- "Local optimization" instead of "Tamil Nadu optimization"

No frontend code changes are needed when switching regions.

## Database Considerations

When switching regions:
1. **Clear existing data**: Remove old hospital/blood bank records
2. **Generate new data**: Run the mock data generation for the new region
3. **Update coordinates**: Ensure all new locations have accurate coordinates

## Testing Your Configuration

1. **Update region_config.py** with your region details
2. **Restart the backend** to load new configuration
3. **Generate mock data** for the new region
4. **Test the system** with local coordinates and names

## Best Practices

1. **Accurate Coordinates**: Use precise latitude/longitude for optimal routing
2. **Realistic Names**: Use actual hospital and blood bank names from your region
3. **Strategic Placement**: Distribute facilities across your region for optimal coverage
4. **Local Context**: Consider local emergency numbers and healthcare systems

## Troubleshooting

### Common Issues:
- **Coordinates not found**: Ensure all cities have valid lat/lng values
- **No hospitals showing**: Check that hospital names are properly configured
- **Routing errors**: Verify coordinate accuracy and region boundaries

### Debug Steps:
1. Check region configuration in `region_config.py`
2. Verify mock data generation in logs
3. Test coordinate calculations manually
4. Check database for proper data insertion

## Support

For deployment assistance:
1. Review the configuration examples above
2. Check the backend logs for errors
3. Verify coordinate accuracy with mapping tools
4. Test with a small subset of cities first

## Conclusion

RAKT-RADAR is designed to be region-agnostic while maintaining the benefits of local optimization. By following this guide, you can deploy the system in any region and benefit from:

- **Faster emergency response times**
- **Optimized blood transfer routes**
- **Local network efficiency**
- **Scalable architecture**

The system will automatically adapt to show "Local Network" optimization while maintaining all the distance calculation benefits for your specific region.
