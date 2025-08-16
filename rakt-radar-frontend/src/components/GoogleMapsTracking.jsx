import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle, 
  Circle,
  ArrowLeft,
  Phone,
  Mail
} from 'lucide-react';

const GoogleMapsTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markerRef = useRef(null);

  const [transferData, setTransferData] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('dispatched');
  const [eta, setEta] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load transfer data
  useEffect(() => {
    const data = location.state?.transferData || JSON.parse(localStorage.getItem('currentTransfer') || '{}');
    if (data && Object.keys(data).length > 0) {
      setTransferData(data);
      setEta(data.estimated_time_hours || 2);
    } else {
      // Fallback demo data
      setTransferData({
        blood_type: 'O+',
        quantity_ml: 450,
        source_blood_bank: 'Chennai Central Blood Bank',
        source_location: 'Chennai, Tamil Nadu',
        destination: 'SRM Global Hospitals',
        distance_km: 25.5,
        estimated_time_hours: 2,
        cost: 1250,
        status: 'dispatched'
      });
      setEta(2);
    }
  }, [location]);

  // Initialize Google Maps
  useEffect(() => {
    if (!transferData || mapLoaded) return;

    const loadGoogleMaps = async () => {
      try {
        // Load Google Maps API
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: 'AIzaSyB41DRuKWuJnFuPojMGniBrLXOoQqKxWyg', // Demo key - replace with your own
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        const google = await loader.load();
        
        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 13.0447, lng: 80.2456 }, // Chennai center
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Initialize services
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsRenderer.setMap(map);

        // Store references
        mapInstanceRef.current = map;
        directionsServiceRef.current = directionsService;
        directionsRendererRef.current = directionsRenderer;

        // Add route
        const request = {
          origin: { lat: 13.0827, lng: 80.2707 }, // Chennai Central Blood Bank
          destination: { lat: 13.0067, lng: 80.2206 }, // SRM Global Hospitals
          travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Add markers
            new google.maps.Marker({
              position: { lat: 13.0827, lng: 80.2707 },
              map: map,
              title: 'Chennai Central Blood Bank',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12)
              }
            });

            new google.maps.Marker({
              position: { lat: 13.0067, lng: 80.2206 },
              map: map,
              title: 'SRM Global Hospitals',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12)
              }
            });

            setMapLoaded(true);
          }
        });

      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    loadGoogleMaps();
  }, [transferData, mapLoaded]);

  // Vehicle tracking simulation
  useEffect(() => {
    if (!mapLoaded || !isTracking) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 0.02, 1);
        
        if (newProgress >= 1) {
          setIsTracking(false);
          setCurrentStatus('delivered');
        } else if (newProgress >= 0.75) {
          setCurrentStatus('arriving_soon');
        } else if (newProgress >= 0.25) {
          setCurrentStatus('in_transit');
        }
        
        return newProgress;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [mapLoaded, isTracking]);

  // Update ETA
  useEffect(() => {
    const remainingTime = Math.max(0, eta * (1 - progress));
    setEta(remainingTime);
  }, [progress, eta]);

  if (!transferData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-600 mb-2">No Transfer Data Found</div>
          <Button onClick={() => navigate('/smart-routing')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Smart Routing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => navigate('/smart-routing')} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blood Transfer Tracking</h1>
              <p className="text-sm text-gray-600">Live tracking for blood transfer #{transferData.blood_type}-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Status</div>
            <Badge className="bg-blue-100 text-blue-800">
              {currentStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Map Section */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Live Transfer Route</span>
            </CardTitle>
            <CardDescription>
              Real-time tracking of blood transfer from {transferData.source_blood_bank} to {transferData.destination}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] w-full relative">
              <div 
                ref={mapRef} 
                className="h-full w-full rounded-b-lg"
                style={{ minHeight: '500px' }}
              />
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-600 mb-2">Loading Google Maps...</div>
                    <div className="text-sm text-gray-500">Initializing route visualization</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Map Status */}
            <div className="mt-2 text-center p-2">
              <div className="text-sm text-gray-600">
                {mapLoaded ? (
                  <span className="text-green-600">✅ Google Maps loaded successfully!</span>
                ) : (
                  <span className="text-yellow-600">⏳ Loading Google Maps...</span>
                )}
                <span className="ml-2">Route: Chennai Central → SRM Global Hospitals</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transfer Status</CardTitle>
            <CardDescription>Real-time updates on your blood transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'dispatched', label: 'Blood unit has been dispatched from source', icon: Circle },
                { status: 'in_transit', label: 'Vehicle is en route to destination', icon: Truck },
                { status: 'arriving_soon', label: 'Vehicle is approaching destination', icon: Clock },
                { status: 'delivered', label: 'Blood unit has been delivered successfully', icon: CheckCircle }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStatus === step.status;
                const isCompleted = ['dispatched', 'in_transit', 'arriving_soon', 'delivered'].indexOf(currentStatus) >= index;
                
                return (
                  <div key={step.status} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                        {step.status.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">{step.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transfer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Complete information about this blood transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500">Blood Type</div>
                  <div className="text-lg font-semibold text-gray-900">{transferData.blood_type} {transferData.quantity_ml}ml</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Source Hospital</div>
                  <div className="text-sm text-gray-900">{transferData.source_blood_bank}</div>
                  <div className="text-xs text-gray-500">{transferData.source_location}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Destination Hospital</div>
                  <div className="text-sm text-gray-900">{transferData.destination}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500">Distance</div>
                  <div className="text-lg font-semibold text-gray-900">{transferData.distance_km} km</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Estimated Time</div>
                  <div className="text-lg font-semibold text-gray-900">{eta.toFixed(2)} hours</div>
                  <div className="text-xs text-gray-500">Remaining time</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{Math.round(progress * 100)}% complete</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Estimated Cost</div>
                  <div className="text-lg font-semibold text-gray-900">₹{transferData.cost}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-500 mb-2">Current Status</div>
              <Badge className="bg-blue-100 text-blue-800">
                {currentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleMapsTracking;
