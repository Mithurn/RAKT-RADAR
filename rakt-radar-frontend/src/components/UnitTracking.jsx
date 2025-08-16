import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle, 
  Phone,
  Navigation,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const UnitTracking = () => {
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [map, setMap] = useState(null);
  const [mapContainer, setMapContainer] = useState(null);

  useEffect(() => {
    // Check if there's a transfer from SmartRouting
    const currentTransferData = localStorage.getItem('currentTransfer');
    
    if (currentTransferData) {
      try {
        const transferData = JSON.parse(currentTransferData);
        
        // Convert SmartRouting format to tracking format
        const trackingTransfer = {
          id: 'current-transfer',
          bloodType: transferData.blood_type,
          quantity: `${transferData.quantity_ml}ml`,
          source: transferData.source_blood_bank,
          destination: transferData.entity_name,
          status: 'preparing',
          progress: 25,
          estimatedArrival: new Date(Date.now() + transferData.estimated_time_hours * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          driver: 'Dr. Rajesh Kumar',
          driverPhone: '+91 98765 43210',
          vehicle: 'Blood Transport Van MH-01-AB-1234',
          currentLocation: transferData.source_location || 'Blood Bank Location',
          route: {
            distance: `${transferData.distance_km}km`,
            timeRemaining: `${transferData.estimated_time_hours}h`,
            trafficStatus: 'Clear'
          },
          updates: [
            { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: 'AI analysis completed, transfer initiated', status: 'completed' },
            { time: new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: 'Blood unit being prepared for transfer', status: 'active' },
            { time: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: 'Loading into transport vehicle', status: 'pending' },
            { time: new Date(Date.now() + transferData.estimated_time_hours * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: 'Estimated arrival at destination', status: 'pending' }
          ]
        };
        
        setTransfer(trackingTransfer);
        
        // Clear localStorage after loading
        localStorage.removeItem('currentTransfer');
      } catch (error) {
        console.error('Error parsing transfer data:', error);
        // If no valid transfer data, go back to SmartRouting
        navigate('/smart-routing');
      }
    } else {
      // If no transfer data, go back to SmartRouting
      navigate('/smart-routing');
    }
  }, [navigate]);

  // Initialize map when component mounts and transfer is available
  useEffect(() => {
    if (transfer && mapContainer && !map) {
      try {
        // Ensure the container is properly mounted
        if (!mapContainer.offsetParent) {
          return;
        }

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          try {
            const newMap = L.map(mapContainer, {
              zoomControl: true,
              scrollWheelZoom: true,
              doubleClickZoom: true,
              boxZoom: false,
              keyboard: false,
              dragging: true,
              touchZoom: true
            }).setView([19.0760, 72.8777], 10);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 18
            }).addTo(newMap);

            // Wait for tiles to load before adding markers
            newMap.whenReady(() => {
              try {
                // Add markers for source and destination
                const sourceMarker = L.marker([19.0760, 72.8777]).addTo(newMap);
                sourceMarker.bindPopup(`<b>Source:</b> ${transfer.source}`).openPopup();

                const destMarker = L.marker([19.2183, 72.9781]).addTo(newMap);
                destMarker.bindPopup(`<b>Destination:</b> ${transfer.destination}`).openPopup();

                // Draw route line
                const routeLine = L.polyline([
                  [19.0760, 72.8777],
                  [19.2183, 72.9781]
                ], { color: 'red', weight: 3 }).addTo(newMap);

                // Add current location marker (simulated)
                const currentMarker = L.marker([19.1472, 72.9279], {
                  icon: L.divIcon({
                    className: 'current-location-marker',
                    html: '<div style="background-color: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20]
                  })
                }).addTo(newMap);
                currentMarker.bindPopup(`<b>Current Location:</b> ${transfer.currentLocation}`).openPopup();

                // Fit bounds to show all markers
                newMap.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
              } catch (markerError) {
                console.error('Error adding markers:', markerError);
              }
            });

            setMap(newMap);
          } catch (mapError) {
            console.error('Error creating map:', mapError);
          }
        }, 100);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error in map initialization:', error);
      }
    }

    return () => {
      if (map) {
        try {
          map.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
      }
    };
  }, [transfer, mapContainer, map]);

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/smart-routing')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Smart Routing
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">🩸 Blood Transfer Tracking</h1>
                <p className="text-sm text-gray-600">Order #{transfer.id}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Estimated Arrival</div>
              <div className="text-lg font-bold text-green-600">{transfer.estimatedArrival}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Transfer Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Blood Unit Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Blood Unit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Blood Type:</span>
                  <Badge variant="outline" className="text-lg">{transfer.bloodType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{transfer.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Driver Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Driver Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{transfer.driver}</div>
                    <div className="text-sm text-gray-600">{transfer.vehicle}</div>
                  </div>
                </div>
                <Button 
                  onClick={() => window.open(`tel:${transfer.driverPhone}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Driver
                </Button>
              </CardContent>
            </Card>

            {/* Route Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Route Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{transfer.source}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{transfer.destination}</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{transfer.route.distance}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time Left:</span>
                    <span className="font-medium text-orange-600">{transfer.route.timeRemaining}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Traffic:</span>
                    <span className="font-medium text-green-600">{transfer.route.trafficStatus}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transfer Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-blue-600">{transfer.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${transfer.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Blood unit is being transported to your location
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Live Tracking Map
                </CardTitle>
                <CardDescription>Real-time location tracking of your blood transfer</CardDescription>
              </CardHeader>
              <CardContent>
                                 <div 
                   ref={setMapContainer}
                   className="w-full h-96 rounded-lg border-2 border-gray-200 bg-gray-50"
                   style={{ minHeight: '400px' }}
                 >
                   {!map && (
                     <div className="w-full h-full flex items-center justify-center">
                       <div className="text-center">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                         <p className="text-sm text-gray-500">Loading map...</p>
                       </div>
                     </div>
                   )}
                 </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Source</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Destination</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Current Location</span>
                    </div>
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

export default UnitTracking;
