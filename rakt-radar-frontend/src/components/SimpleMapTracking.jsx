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
  Cloud
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

// Custom hospital icons
const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: '<div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const destinationIcon = L.divIcon({
  className: 'custom-destination-marker',
  html: '<div class="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Drone icon with pulsing animation
const droneIcon = L.divIcon({
  className: 'custom-drone-marker',
  html: '<div class="w-8 h-8 bg-purple-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const EnhancedMapTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const droneMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  const [transferData, setTransferData] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('dispatched');
  const [eta, setEta] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dronePosition, setDronePosition] = useState([0, 0]);
  
  // Drone-specific states
  const [droneAltitude, setDroneAltitude] = useState(120);
  const [droneBattery, setDroneBattery] = useState(85);
  const [droneSpeed, setDroneSpeed] = useState(45);
  const [weatherCondition, setWeatherCondition] = useState('clear');
  const [flightPath, setFlightPath] = useState([]);

  // Load transfer data
  useEffect(() => {
    const data = location.state?.transferData || JSON.parse(localStorage.getItem('currentTransfer') || '{}');
    if (data && Object.keys(data).length > 0) {
      setTransferData(data);
      // Convert hours to minutes for drone delivery
      setEta(Math.ceil((data.estimated_time_hours || 2) * 60 / 4)); // 4x faster than vehicle
    } else {
      // Fallback demo data for Tamil Nadu with drone delivery
      setTransferData({
        blood_type: 'O+',
        quantity_ml: 450,
        source_blood_bank: 'Chennai Central Blood Bank',
        source_location: 'Chennai, Tamil Nadu',
        destination: 'Apollo Hospitals Chennai',
        distance_km: 45.2,
        estimated_time_hours: 0.5, // 30 minutes for drone
        cost: 2200, // Slightly higher for drone delivery
        status: 'dispatched',
        coordinates: {
          source: [13.0827, 80.2707], // Chennai Central Blood Bank coordinates
          destination: [13.0067, 80.2206], // Apollo Hospitals coordinates
          current: [13.0447, 80.2456] // Midpoint for drone start
        }
      });
      setEta(30); // 30 minutes for drone delivery
    }
  }, [location]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !transferData) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([12.9529, 80.1576], 10);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add source marker
    if (transferData.coordinates?.source) {
      const sourceMarker = L.marker(transferData.coordinates.source, { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-center">
            <div class="font-semibold text-blue-600">🏥 Source Blood Bank</div>
            <div class="text-sm">${transferData.source_blood_bank}</div>
            <div class="text-xs text-gray-500">${transferData.source_location}</div>
          </div>
        `);
    }

    // Add destination marker
    if (transferData.coordinates?.destination) {
      const destMarker = L.marker(transferData.coordinates.destination, { icon: destinationIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-center">
            <div class="font-semibold text-green-600">🏥 Destination Hospital</div>
            <div class="text-sm">${transferData.destination}</div>
          </div>
        `);
    }

    // Draw drone flight path with elevation
    if (transferData.coordinates?.source && transferData.coordinates?.destination) {
      // Create curved flight path for drone (more realistic than straight line)
      const source = transferData.coordinates.source;
      const destination = transferData.coordinates.destination;
      
      // Calculate midpoint with elevation
      const midLat = (source[0] + destination[0]) / 2;
      const midLng = (source[1] + destination[1]) / 2;
      const elevatedMid = [midLat + 0.01, midLng + 0.01]; // Slight elevation for drone path
      
      const flightPathCoords = [source, elevatedMid, destination];
      
      const routeLine = L.polyline(flightPathCoords, {
        color: '#8B5CF6',
        weight: 3,
        opacity: 0.8,
        dashArray: '15, 10',
        className: 'drone-flight-path'
      }).addTo(map);
      
      routeLineRef.current = routeLine;
      setFlightPath(flightPathCoords);
    }

    // Add drone marker
    if (transferData.coordinates?.current) {
      const droneMarker = L.marker(transferData.coordinates.current, { icon: droneIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-center">
            <div class="font-semibold text-purple-600">🚁 Blood Delivery Drone</div>
            <div class="text-sm">${transferData.blood_type} - ${transferData.quantity_ml}ml</div>
            <div class="text-xs text-gray-500">Altitude: ${droneAltitude}m | Speed: ${droneSpeed}km/h</div>
            <div class="text-xs text-gray-500">Battery: ${droneBattery}% | Status: ${currentStatus}</div>
          </div>
        `);
      droneMarkerRef.current = droneMarker;
      setDronePosition(transferData.coordinates.current);
    }

    // Fit map to show both markers
    if (transferData.coordinates?.source && transferData.coordinates?.destination) {
      const bounds = L.latLngBounds([
        transferData.coordinates.source,
        transferData.coordinates.destination
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [transferData]);

  // Drone tracking simulation
  useEffect(() => {
    if (!isTracking || !transferData?.coordinates) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 0.03, 1); // Faster progress for drone
        
        // Update drone position on map
        if (mapInstanceRef.current && droneMarkerRef.current && transferData.coordinates && flightPath.length > 0) {
          // Use curved flight path for more realistic drone movement
          const source = flightPath[0];
          const destination = flightPath[flightPath.length - 1];
          
          // Calculate intermediate position along curved path
          const lat = source[0] + (destination[0] - source[0]) * newProgress;
          const lng = source[1] + (destination[1] - source[1]) * newProgress;
          
          // Add slight altitude variation for drone movement
          const altitudeVariation = Math.sin(newProgress * Math.PI) * 0.005;
          const newPosition = [lat + altitudeVariation, lng];
          
          droneMarkerRef.current.setLatLng(newPosition);
          setDronePosition(newPosition);
          
          // Update drone status based on progress
          if (newProgress > 0.8) {
            setCurrentStatus('approaching');
          } else if (newProgress > 0.5) {
            setCurrentStatus('in_transit');
          } else if (newProgress > 0.2) {
            setCurrentStatus('ascending');
          }
          
          // Update drone metrics
          setDroneAltitude(Math.max(80, 120 - (newProgress * 40))); // Gradually descend
          setDroneBattery(Math.max(20, 85 - (newProgress * 65))); // Battery consumption
          setDroneSpeed(newProgress > 0.8 ? 25 : 45); // Slow down for landing
          
          // Update weather conditions (simulate real-time changes)
          if (newProgress > 0.6 && weatherCondition === 'clear') {
            setWeatherCondition('light_wind');
          }
        }
        
        return newProgress;
      });
    }, 1000); // Update every second for smoother drone movement

    return () => clearInterval(interval);
  }, [isTracking, transferData, flightPath, weatherCondition]);

  // Update status based on progress
  useEffect(() => {
    if (progress >= 1) {
      setCurrentStatus('delivered');
      setIsTracking(false);
    } else if (progress >= 0.8) {
      setCurrentStatus('approaching');
    } else if (progress >= 0.5) {
      setCurrentStatus('in_transit');
    } else if (progress >= 0.2) {
      setCurrentStatus('ascending');
    }
  }, [progress]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'ascending': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-yellow-100 text-yellow-800';
      case 'approaching': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'dispatched': return '🚁';
      case 'ascending': return '⬆️';
      case 'in_transit': return '✈️';
      case 'approaching': return '⬇️';
      case 'delivered': return '✅';
      default: return '🚁';
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🚁 Drone Blood Delivery Tracking</h1>
                <p className="text-gray-600">Live tracking of emergency blood delivery via autonomous drone</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-purple-600">SRM Global Hospitals</div>
              <div className="text-sm text-gray-500">Chennai, Tamil Nadu</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-purple-600" />
                  <span>Live Drone Flight Path</span>
                </CardTitle>
                <CardDescription>
                  Real-time tracking of blood delivery drone from {transferData?.source_blood_bank} to {transferData?.destination}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div ref={mapRef} className="w-full h-full" />
                
                {/* Drone Status Overlay */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Battery className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Battery: {droneBattery}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Cloud className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Altitude: {droneAltitude}m</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">Speed: {droneSpeed} km/h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Weather: {weatherCondition.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transfer Details & Status */}
          <div className="space-y-6">
            {/* Transfer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span>Blood Transfer Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Blood Type</div>
                    <div className="font-semibold text-lg">{transferData?.blood_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Quantity</div>
                    <div className="font-semibold text-lg">{transferData?.quantity_ml}ml</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Distance</div>
                    <div className="font-semibold text-lg">{transferData?.distance_km}km</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">ETA</div>
                    <div className="font-semibold text-lg text-purple-600">{formatTime(eta)}</div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="text-sm text-gray-500 mb-2">Delivery Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{Math.round(progress * 100)}% Complete</div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Delivery Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'dispatched', label: 'Drone Dispatched', time: 'Now' },
                    { status: 'ascending', label: 'Drone Ascending', time: progress > 0.2 ? '2 min ago' : 'Pending' },
                    { status: 'in_transit', label: 'In Flight', time: progress > 0.5 ? '5 min ago' : 'Pending' },
                    { status: 'approaching', label: 'Approaching Hospital', time: progress > 0.8 ? '8 min ago' : 'Pending' },
                    { status: 'delivered', label: 'Delivered', time: progress >= 1 ? '10 min ago' : 'Pending' }
                  ].map((step, index) => (
                    <div key={step.status} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        progress >= (index * 0.25) ? 'bg-purple-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{step.label}</div>
                        <div className="text-xs text-gray-500">{step.time}</div>
                      </div>
                      {progress >= (index * 0.25) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl mb-2">{getStatusIcon(currentStatus)}</div>
                  <Badge className={`text-lg px-4 py-2 ${getStatusColor(currentStatus)}`}>
                    {currentStatus.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-2">
                    {currentStatus === 'dispatched' && 'Drone preparing for takeoff...'}
                    {currentStatus === 'ascending' && 'Drone ascending to flight altitude...'}
                    {currentStatus === 'in_transit' && 'Drone flying to destination...'}
                    {currentStatus === 'approaching' && 'Drone preparing for landing...'}
                    {currentStatus === 'delivered' && 'Blood successfully delivered!'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapTracking;
