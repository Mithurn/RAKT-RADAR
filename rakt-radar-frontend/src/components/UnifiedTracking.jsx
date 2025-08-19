import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Circle,
  ArrowLeft,
  Building2,
  Heart,
  Navigation,
  Zap,
  Battery,
  Wifi,
  Cloud,
  Truck,
  User,
  RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: '<div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const bloodBankIcon = L.divIcon({
  className: 'custom-blood-bank-marker',
  html: '<div class="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const driverIcon = L.divIcon({
  className: 'custom-driver-marker',
  html: '<div class="w-12 h-12 bg-green-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center animate-pulse" style="box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);"><svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1l2-2h4l2 2h1a1 1 0 001-1V5a1 1 0 00-1-1H3z"/></svg></div>',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48]
});

const destinationIcon = L.divIcon({
  className: 'custom-destination-marker',
  html: '<div class="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const API_BASE = '/api';

const UnifiedTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  const [trackingData, setTrackingData] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [eta, setEta] = useState(0);
  const [progress, setProgress] = useState(0);
  const [driverPosition, setDriverPosition] = useState([0, 0]);
  
  // Driver tracking states
  const [driverAltitude, setDriverAltitude] = useState(0);
  const [driverSpeed, setDriverSpeed] = useState(0);
  const [weatherCondition, setWeatherCondition] = useState('clear');
  const [routePath, setRoutePath] = useState([]);
  const [driverTrail, setDriverTrail] = useState([]);
  const [userRole, setUserRole] = useState(null);

  // Load user role and tracking data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }

    // Get request ID from URL params or location state
    const requestId = location.state?.requestId || new URLSearchParams(location.search).get('requestId');
    if (requestId) {
      fetchTrackingData(requestId);
    }
  }, [location]);

  const fetchTrackingData = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/routes/tracking/${requestId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
        setCurrentStatus(data.route.status);
        setEta(data.route.eta_minutes);
        
        // Initialize map with route data
        initializeMap(data);
        
        // Start real-time tracking
        startRealTimeTracking(requestId);
      } else {
        console.error('Failed to fetch tracking data');
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  const initializeMap = (data) => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([
      (data.locations.start.latitude + data.locations.end.latitude) / 2,
      (data.locations.start.longitude + data.locations.end.longitude) / 2
    ], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers
    const startMarker = L.marker([data.locations.start.latitude, data.locations.start.longitude], { icon: bloodBankIcon })
      .addTo(map)
      .bindPopup(`<b>${data.locations.start.name}</b><br>${data.locations.start.address}`);

    const endMarker = L.marker([data.locations.end.latitude, data.locations.end.longitude], { icon: hospitalIcon })
      .addTo(map)
      .bindPopup(`<b>${data.locations.end.name}</b><br>${data.locations.end.address}`);

    // Add driver marker at start position
    driverMarkerRef.current = L.marker([data.locations.start.latitude, data.locations.start.longitude], { icon: driverIcon })
      .addTo(map)
      .bindPopup(`<b>${data.driver.name}</b><br>Vehicle: ${data.driver.vehicle_number}`);

    // Draw route line
    const routeCoordinates = [
      [data.locations.start.latitude, data.locations.start.longitude],
      [data.locations.end.latitude, data.locations.end.longitude]
    ];

    routeLineRef.current = L.polyline(routeCoordinates, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);

    // Fit map to show entire route
    map.fitBounds(routeCoordinates);
  };

  const startRealTimeTracking = (requestId) => {
    // Simulate real-time updates every 5 seconds
    const interval = setInterval(async () => {
      if (!isTracking) {
        clearInterval(interval);
        return;
      }

      try {
        // Fetch updated tracking data
        const response = await fetch(`${API_BASE}/routes/tracking/${requestId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          updateTrackingDisplay(data);
        }
      } catch (error) {
        console.error('Error updating tracking:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const updateTrackingDisplay = (data) => {
    setCurrentStatus(data.route.status);
    setProgress(data.tracking.progress_percentage);
    
    // Update driver position if route is active
    if (data.route.status === 'active' && data.tracking.track_points.length > 0) {
      const latestPoint = data.tracking.track_points[data.tracking.track_points.length - 1];
      const newPosition = [latestPoint.latitude, latestPoint.longitude];
      
      setDriverPosition(newPosition);
      
      // Update driver marker on map
      if (driverMarkerRef.current && mapInstanceRef.current) {
        driverMarkerRef.current.setLatLng(newPosition);
        
        // Add to driver trail
        setDriverTrail(prev => [...prev, newPosition]);
        
        // Update route line to show actual path
        if (driverTrail.length > 1) {
          const actualPath = [...driverTrail, newPosition];
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(actualPath);
          }
        }
      }
    }
  };

  const handleStartRoute = async () => {
    if (!trackingData) return;
    
    try {
      const response = await fetch(`${API_BASE}/routes/${trackingData.route.id}/start`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setCurrentStatus('active');
        // Refresh tracking data
        fetchTrackingData(trackingData.request.id);
      }
    } catch (error) {
      console.error('Error starting route:', error);
    }
  };

  const handleCompleteRoute = async () => {
    if (!trackingData) return;
    
    try {
      const response = await fetch(`${API_BASE}/routes/${trackingData.route.id}/complete`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setCurrentStatus('completed');
        setProgress(100);
        // Refresh tracking data
        fetchTrackingData(trackingData.request.id);
      }
    } catch (error) {
      console.error('Error completing route:', error);
    }
  };

  const handleProgressUpdate = async () => {
    if (!trackingData) return;
    
    try {
      const response = await fetch(`${API_BASE}/routes/${trackingData.route.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: driverPosition[0],
          longitude: driverPosition[1]
        })
      });
      
      if (response.ok) {
        // Refresh tracking data
        fetchTrackingData(trackingData.request.id);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Tracking Data</h2>
            <p className="text-gray-600">Please select an emergency request to track.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Blood Delivery Tracking</h1>
            <p className="text-gray-600">Live tracking of emergency blood delivery via ground transport</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {trackingData.locations.end.name}
            </div>
            <div className="text-sm text-gray-600">
              {trackingData.locations.end.address}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Live Delivery Route
                </CardTitle>
                <CardDescription>
                  Real-time tracking of the delivery vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg border"
                  style={{ minHeight: '400px' }}
                ></div>
              </CardContent>
            </Card>
          </div>

          {/* Tracking Details */}
          <div className="space-y-6">
            {/* Blood Transfer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Blood Transfer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Blood Type</div>
                    <div className="font-semibold">{trackingData.request.blood_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Quantity</div>
                    <div className="font-semibold">{trackingData.request.quantity_ml}ml</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Distance</div>
                    <div className="font-semibold">{trackingData.route.distance_km} km</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">ETA</div>
                    <div className="font-semibold">{trackingData.route.eta_minutes} min</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Delivery Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{progress.toFixed(1)}% Complete</div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="font-medium">{trackingData.driver.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <span className="font-medium">{trackingData.driver.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="font-medium">{trackingData.driver.phone}</span>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-purple-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={currentStatus === 'completed' ? 'default' : 'secondary'}>
                    {currentStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Speed:</span>
                  <span className="font-medium">{driverSpeed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weather:</span>
                  <span className="font-medium capitalize">{weatherCondition}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {userRole === 'driver' && (
              <Card>
                <CardHeader>
                  <CardTitle>Driver Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentStatus === 'pending' && (
                    <Button 
                      onClick={handleStartRoute}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Start Route
                    </Button>
                  )}
                  
                  {currentStatus === 'active' && (
                    <>
                      <Button 
                        onClick={handleProgressUpdate}
                        variant="outline"
                        className="w-full"
                      >
                        Update Progress
                      </Button>
                      <Button 
                        onClick={handleCompleteRoute}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Complete Delivery
                      </Button>
                    </>
                  )}
                  
                  {currentStatus === 'completed' && (
                    <div className="text-center text-green-600 font-medium">
                      ✅ Delivery Completed!
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Refresh Button */}
            <Button 
              onClick={() => fetchTrackingData(trackingData.request.id)}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Tracking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTracking;
