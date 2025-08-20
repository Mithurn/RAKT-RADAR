import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
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
  Truck,
  User,
  Phone,
  Navigation,
  Package
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
  html: '<div class="w-10 h-10 bg-blue-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const bloodBankIcon = L.divIcon({
  className: 'custom-blood-bank-marker',
  html: '<div class="w-10 h-10 bg-red-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const driverIcon = L.divIcon({
  className: 'custom-driver-marker',
  html: '<div class="w-14 h-14 bg-green-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-pulse" style="box-shadow: 0 0 25px rgba(34, 197, 94, 0.8);"><svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1l2-2h4l2 2h1a1 1 0 001-1V5a1 1 0 00-1-1H3z"/></svg></div>',
  iconSize: [56, 56],
  iconAnchor: [28, 56],
  popupAnchor: [0, -56]
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
  const [currentStatus, setCurrentStatus] = useState('in_transit');
  const [eta, setEta] = useState(25);
  const [progress, setProgress] = useState(65);
  const [driverPosition, setDriverPosition] = useState([13.0827, 80.2707]);
  const [userRole, setUserRole] = useState(null);

  // Load user role and tracking data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }

    // Check for approved route data from localStorage first
    const approvedRouteData = localStorage.getItem('approvedRouteData');
    if (approvedRouteData) {
      try {
        const routeData = JSON.parse(approvedRouteData);
        console.log('✅ Found approved route data in localStorage:', routeData);
        
        // Transform the data to match tracking format
        const trackingData = {
          id: routeData.id,
          blood_type: routeData.blood_type,
          quantity_ml: routeData.quantity_ml,
          source: {
            name: routeData.source.name,
            latitude: routeData.source.latitude,
            longitude: routeData.source.longitude
          },
          destination: {
            name: routeData.destination.name,
            latitude: routeData.destination.latitude,
            longitude: routeData.destination.longitude
          },
          driver: {
            name: routeData.driver.name,
            phone: routeData.driver.phone,
            vehicle_number: routeData.driver.vehicle_number
          },
          status: routeData.status || 'pending',
          eta_minutes: routeData.eta_minutes || 25,
          progress: 0,
          distance_km: routeData.distance_km || 0,
          created_at: routeData.created_at
        };
        
        console.log('✅ Setting tracking data from approved route:', trackingData);
        setTrackingData(trackingData);
        setCurrentStatus('pending');
        return; // Exit early since we have data
      } catch (error) {
        console.error('❌ Error parsing approved route data:', error);
      }
    }

    // Get route ID or request ID from URL params or location state
    const routeId = location.state?.routeId || new URLSearchParams(location.search).get('routeId');
    const requestId = location.state?.requestId || new URLSearchParams(location.search).get('requestId');
    console.log('📍 Location state:', location.state);
    console.log('📍 Route ID from location:', routeId);
    console.log('📍 Request ID from location:', requestId);
    
    if (routeId) {
      console.log('🔄 Route ID provided, fetching route data directly');
      fetchRouteData(routeId);
    } else if (requestId) {
      console.log('🔄 Request ID provided, fetching tracking data for request ID:', requestId);
      fetchTrackingData(requestId);
    } else {
      console.log('🔄 No route ID or request ID, setting demo data');
      // Set demo data for development
      setDemoData();
    }
  }, [location]);

  // Initialize map when tracking data is available
  useEffect(() => {
    console.log('Map initialization effect triggered:', { trackingData, mapRef: mapRef.current, mapInstance: mapInstanceRef.current });
    if (trackingData && mapRef.current && !mapInstanceRef.current) {
      console.log('Initializing map with data:', trackingData);
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap(trackingData);
      }, 100);
    }
  }, [trackingData]);

  const setDemoData = () => {
    console.log('🔄 Setting demo data for tracking');
    
    // Check if there's an active route from the current user's routes
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      console.log('👤 Current user:', user);
      
      // Try to fetch active routes from API
      fetchActiveRoutes(user);
    } else {
      console.log('❌ No user data found');
      setTrackingData(null);
      setCurrentStatus('waiting');
    }
  };

  const fetchRouteData = async (routeId) => {
    try {
      console.log('🔄 Fetching specific route data for route ID:', routeId);
      
      // Try authenticated endpoint first
      let response = await fetch(`/api/routes`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.log('⚠️ Authenticated endpoint failed, trying demo endpoint...');
        // Fallback to demo endpoint
        response = await fetch(`/api/demo/routes`);
      }
      
      if (response.ok) {
        const routes = await response.json();
        console.log('📡 All routes received:', routes);
        
        // Find the specific route
        const route = routes.find(r => r.id === routeId);
        
        if (route) {
          console.log('✅ Found specific route:', route);
          
          // Transform API route data to tracking format
          const routeData = {
            id: route.id,
            blood_type: route.request?.blood_type || 'Unknown',
            quantity_ml: route.request?.quantity_ml || 0,
            source: {
              name: route.blood_bank?.name || 'Blood Bank',
              latitude: route.start_latitude,
              longitude: route.start_longitude
            },
            destination: {
              name: route.hospital?.name || 'Hospital',
              latitude: route.end_latitude,
              longitude: route.end_longitude
            },
            driver: {
              name: route.driver_name || 'Driver',
              phone: '+91-98765-43210',
              vehicle_number: 'TN-01-AB-1234'
            },
            status: route.status,
            eta_minutes: route.eta_minutes || 25,
            progress: 0,
            distance_km: route.distance_km || 0,
            created_at: route.created_at
          };
          
          console.log('✅ Transformed route data:', routeData);
          setTrackingData(routeData);
          setCurrentStatus(route.status === 'active' ? 'in_transit' : 'waiting');
        } else {
          console.log('❌ Route not found, falling back to demo data');
          setDemoData();
        }
      } else {
        console.log('❌ Both endpoints failed, falling back to demo data');
        setDemoData();
      }
    } catch (error) {
      console.error('❌ Error fetching route data:', error);
      setDemoData();
    }
  };

  const fetchActiveRoutes = async (user) => {
    try {
      console.log('🔄 Fetching active routes for user:', user);
      console.log('🔍 User details:', {
        role: user.role,
        entity_id: user.entity_id,
        username: user.username,
        entityDetails: user.entityDetails
      });
      
      // Try authenticated endpoint first
      let response = await fetch('/api/routes', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.log('⚠️ Authenticated endpoint failed, trying demo endpoint...');
        // Fallback to demo endpoint
        response = await fetch('/api/demo/routes');
      }
      
      if (response.ok) {
        const routes = await response.json();
        console.log('📡 API routes received:', routes);
        
        // Find active routes for this user
        let activeRoutes = [];
        if (user.role === 'driver') {
          activeRoutes = routes.filter(route => route.status === 'active');
        } else if (user.role === 'hospital') {
          // Get routes for hospital's requests
          let hospitalRequests = await fetch('/api/emergency_requests', {
            credentials: 'include'
          });
          
          if (!hospitalRequests.ok) {
            console.log('⚠️ Hospital emergency requests failed, trying demo endpoint...');
            hospitalRequests = await fetch('/api/demo/emergency_requests');
          }
          
          if (hospitalRequests.ok) {
            const requests = await hospitalRequests.json();
            const requestIds = requests.map(req => req.id);
            activeRoutes = routes.filter(route => 
              requestIds.includes(route.request_id) && route.status === 'active'
            );
          }
        } else if (user.role === 'blood_bank') {
          // Get routes for blood bank's approved requests
          // Use direct filtering since emergency requests endpoint may fail
          activeRoutes = routes.filter(route => 
            route.blood_bank?.id === user.entity_id && route.status === 'active'
          );
          
          // If no routes found, try alternative filtering
          if (activeRoutes.length === 0) {
            console.log('🔍 No routes found with direct blood bank ID, trying alternative filtering...');
            // Try filtering by request_id if we have entity details
            activeRoutes = routes.filter(route => 
              route.status === 'active' && 
              route.request && 
              route.request.suggested_bank_id === user.entity_id
            );
          }
          
          console.log('🏥 Blood bank filtering results:');
          console.log('- Total routes:', routes.length);
          console.log('- User entity ID:', user.entity_id);
          console.log('- Routes with blood_bank ID:', routes.filter(r => r.blood_bank?.id === user.entity_id).length);
          console.log('- Active routes found:', activeRoutes.length);
        }
        
        console.log('🚚 Active routes found:', activeRoutes);
        console.log('🔍 Debug info for user:', user.role);
        console.log('- User entity ID:', user.entity_id);
        console.log('- Total routes available:', routes.length);
        console.log('- Routes with status "active":', routes.filter(r => r.status === 'active').length);
        if (user.role === 'blood_bank') {
          console.log('- Routes with blood_bank ID matching user:', routes.filter(r => r.blood_bank?.id === user.entity_id).length);
          console.log('- Sample route blood_bank IDs:', routes.slice(0, 3).map(r => ({ id: r.id, blood_bank_id: r.blood_bank?.id, status: r.status })));
        }
        
        if (activeRoutes.length > 0) {
          // Sort routes by creation time (most recent first) and use the latest one
          const sortedRoutes = activeRoutes.sort((a, b) => {
            const timeA = new Date(a.created_at || 0);
            const timeB = new Date(b.created_at || 0);
            return timeB - timeA; // Most recent first
          });
          
          const activeRoute = sortedRoutes[0]; // Use most recent active route
          console.log('✅ Using most recent active route:', activeRoute);
          console.log('📅 Route creation time:', activeRoute.created_at);
          
          // Transform API route data to tracking format
          const routeData = {
            id: activeRoute.id,
            blood_type: activeRoute.request?.blood_type || 'Unknown',
            quantity_ml: activeRoute.request?.quantity_ml || 0,
            source: {
              name: activeRoute.blood_bank?.name || 'Blood Bank',
              latitude: activeRoute.start_latitude,
              longitude: activeRoute.start_longitude
            },
            destination: {
              name: activeRoute.hospital?.name || 'Hospital',
              latitude: activeRoute.end_latitude,
              longitude: activeRoute.end_longitude
            },
            driver: {
              name: activeRoute.driver_name || 'Driver',
              phone: '+91-98765-43210',
              vehicle_number: 'TN-01-AB-1234'
            },
            status: activeRoute.status,
            eta_minutes: activeRoute.eta_minutes || 25,
            progress: 0,
            distance_km: activeRoute.distance_km || 0,
            created_at: activeRoute.created_at
          };
          
          console.log('Route data set:', routeData);
          setTrackingData(routeData);
          setCurrentStatus('in_transit');
          setEta(routeData.eta_minutes);
          setProgress(0);
        } else {
          console.log('❌ No active routes found');
          setTrackingData(null);
          setCurrentStatus('waiting');
        }
      } else {
        console.log('❌ Failed to fetch routes from API');
        setTrackingData(null);
        setCurrentStatus('waiting');
      }
    } catch (error) {
      console.error('❌ Error fetching active routes:', error);
      setTrackingData(null);
      setCurrentStatus('waiting');
    }
  };

  const fetchTrackingData = async (requestId) => {
    try {
      console.log('🔄 Fetching tracking data for request:', requestId);
      
      // Fetch route data from API
      const response = await fetch(`/api/routes/tracking/${requestId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const routeData = await response.json();
        console.log('✅ Found route data from API:', routeData);
        
        // Transform the API data to tracking format
        const data = {
          id: routeData.route?.id || requestId,
          blood_type: routeData.request?.blood_type || 'Unknown',
          quantity_ml: routeData.request?.quantity_ml || 0,
          source: {
            name: routeData.locations?.start?.name || 'Blood Bank',
            latitude: routeData.locations?.start?.latitude || 0,
            longitude: routeData.locations?.start?.longitude || 0
          },
          destination: {
            name: routeData.locations?.end?.name || 'Hospital',
            latitude: routeData.locations?.end?.latitude || 0,
            longitude: routeData.locations?.end?.longitude || 0
          },
          driver: {
            name: routeData.driver?.name || 'Driver',
            phone: routeData.driver?.phone || '+91-98765-43210',
            vehicle_number: routeData.driver?.vehicle_number || 'TN-01-AB-1234'
          },
          status: routeData.route?.status || 'active',
          eta_minutes: routeData.route?.eta_minutes || 25,
          progress: 0,
          distance_km: routeData.route?.distance_km || 0,
          created_at: routeData.route?.created_at
        };
        
        setTrackingData(data);
        setCurrentStatus(data.status || 'in_transit');
        setEta(data.eta_minutes || 25);
        setProgress(0);
        
        // Initialize map with route data
        initializeMap(data);
        
        // Start real-time tracking (simulated)
        startRealTimeTracking(requestId);
      } else {
        console.log('❌ No active route found, using demo data');
        setDemoData();
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setDemoData();
    }
  };

  const initializeMap = (data) => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Use the correct data structure from our demo data
    const startLat = data.source?.latitude || data.locations?.start?.latitude;
    const startLng = data.source?.longitude || data.locations?.start?.longitude;
    const endLat = data.destination?.latitude || data.locations?.end?.latitude;
    const endLng = data.destination?.longitude || data.locations?.end?.longitude;

    if (!startLat || !startLng || !endLat || !endLng) {
      console.error('Missing coordinates for map initialization');
      return;
    }

    const map = L.map(mapRef.current).setView([
      (startLat + endLat) / 2,
      (startLng + endLng) / 2
    ], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers
    const startMarker = L.marker([startLat, startLng], { icon: bloodBankIcon })
      .addTo(map)
      .bindPopup(`<b>${data.source?.name || data.locations?.start?.name}</b><br>${data.source?.address || data.locations?.start?.address}`);

    const endMarker = L.marker([endLat, endLng], { icon: hospitalIcon })
      .addTo(map)
      .bindPopup(`<b>${data.destination?.name || data.locations?.end?.name}</b><br>${data.destination?.address || data.locations?.end?.address}`);

    // Add driver marker at start position
    driverMarkerRef.current = L.marker([startLat, startLng], { icon: driverIcon })
      .addTo(map)
      .bindPopup(`<b>${data.driver.name}</b><br>Vehicle: ${data.driver.vehicle_number}`);

    // Draw route line
    const routeCoordinates = [
      [startLat, startLng],
      [endLat, endLng]
    ];

    routeLineRef.current = L.polyline(routeCoordinates, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.8,
      dashArray: '15, 10'
    }).addTo(map);

    // Fit map to show entire route
    map.fitBounds(routeCoordinates);
  };

  const startRealTimeTracking = (requestId) => {
    console.log('🚀 Starting real-time tracking simulation for request:', requestId);
    
    // Simulate real-time updates every 3 seconds
    const interval = setInterval(async () => {
      if (!isTracking) {
        console.log('🛑 Tracking stopped, clearing interval');
        clearInterval(interval);
        return;
      }

      try {
        // For demo purposes, simulate progress updates instead of API calls
        console.log('🔄 Simulating tracking update...');
        
        // Get current route data from localStorage
        const assignedRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
        const activeRoute = assignedRoutes.find(route => route.id === requestId && route.status === 'in_transit');
        
        if (activeRoute) {
          // Simulate progress increase
          const currentProgress = progress;
          const newProgress = Math.min(currentProgress + Math.random() * 5, 100); // Random progress increase
          
          setProgress(newProgress);
          
          // Simulate ETA decrease
          const currentEta = eta;
          const newEta = Math.max(currentEta - Math.random() * 2, 1); // Random ETA decrease
          setEta(Math.round(newEta));
          
          console.log(`📊 Progress: ${newProgress.toFixed(1)}%, ETA: ${Math.round(newEta)} min`);
        }
      } catch (error) {
        console.error('Error updating tracking:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const updateTrackingDisplay = (data) => {
    // For demo purposes, we're handling updates in startRealTimeTracking
    // This function is kept for compatibility but not actively used
    console.log('📊 updateTrackingDisplay called with:', data);
    
    if (data.route?.status) {
      setCurrentStatus(data.route.status);
    }
    if (data.route?.eta_minutes) {
      setEta(data.route.eta_minutes);
    }
    if (data.route?.progress) {
      setProgress(data.route.progress);
    }
    
    // Update driver position on map if available
    if (driverMarkerRef.current && data.driver?.current_position) {
      const newPos = [data.driver.current_position.latitude, data.driver.current_position.longitude];
      driverMarkerRef.current.setLatLng(newPos);
      setDriverPosition(newPos);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'dispatched':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'dispatched':
        return <Package className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getRoleSpecificInfo = () => {
    if (!trackingData || !userRole) return null;

    switch (userRole) {
      case 'hospital':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blood Type</span>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-lg">{trackingData.blood_type}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Quantity</span>
              <span className="font-semibold">{trackingData.quantity_ml}ml</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blood Bank</span>
              <span className="font-semibold text-sm">{trackingData.source.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ETA</span>
              <span className="font-semibold text-blue-600">{eta} min</span>
            </div>
          </div>
        );

      case 'blood_bank':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hospital</span>
              <span className="font-semibold text-sm">{trackingData.destination.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blood Unit</span>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-semibold">{trackingData.blood_type} - {trackingData.quantity_ml}ml</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Driver</span>
              <span className="font-semibold">{trackingData.driver.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <Badge className={getStatusColor(currentStatus)}>
                {getStatusIcon(currentStatus)}
                <span className="ml-1 capitalize">{currentStatus.replace('_', ' ')}</span>
              </Badge>
            </div>
          </div>
        );

      case 'driver':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hospital</span>
              <span className="font-semibold text-sm">{trackingData.destination.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blood Type</span>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-semibold">{trackingData.blood_type}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Time Remaining</span>
              <span className="font-semibold text-red-600">{eta} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Distance</span>
              <span className="font-semibold">{trackingData.distance_km} km</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Waiting for Route to Start</h2>
          <p className="text-gray-600 mb-4">No active delivery route found.</p>
          <div className="text-sm text-gray-500">
            <p>• Hospital must order blood and get approval</p>
            <p>• Blood bank must approve the request</p>
            <p>• Driver must click "Start Route" to begin tracking</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Live Tracking</h1>
              <p className="text-sm text-gray-600">Transfer #{trackingData.id}</p>
            </div>
          </div>
          
          <Badge className={getStatusColor(currentStatus)}>
            {getStatusIcon(currentStatus)}
            <span className="ml-1 capitalize">{currentStatus.replace('_', ' ')}</span>
          </Badge>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Map Section - Takes most of the screen */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="w-full h-full map-wrapper"
            style={{ minHeight: '600px', height: '100%' }}
          >
            {/* Fallback content if map doesn't load */}
            {!mapInstanceRef.current && (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
      
      {/* Progress Bar Overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Delivery Progress</span>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{trackingData.source.name}</span>
              <span className="text-xs text-gray-500">{trackingData.destination.name}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

        {/* Info Panel - Compact and clean */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Role-specific Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {userRole === 'hospital' && 'Delivery Details'}
                {userRole === 'blood_bank' && 'Transfer Status'}
                {userRole === 'driver' && 'Route Info'}
              </h3>
              {getRoleSpecificInfo()}
            </div>

            {/* Driver Information */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Driver Details</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{trackingData.driver.name}</p>
                    <p className="text-sm text-gray-500">{trackingData.driver.vehicle_number}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Driver
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Package className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTracking;
