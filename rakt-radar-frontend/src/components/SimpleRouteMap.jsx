import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Navigation, Clock, Truck } from 'lucide-react';
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
const bloodBankIcon = L.divIcon({
  className: 'custom-blood-bank-marker',
  html: '<div class="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: '<div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg></div>',
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

const SimpleRouteMap = ({ routeData, userRole, onStartRoute, onCompleteRoute }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  useEffect(() => {
    if (routeData && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [routeData]);

  const initializeMap = () => {
    if (!routeData) return;

    const map = L.map(mapRef.current).setView([
      (routeData.locations.start.latitude + routeData.locations.end.latitude) / 2,
      (routeData.locations.start.longitude + routeData.locations.end.longitude) / 2
    ], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add start marker (Blood Bank)
    L.marker([routeData.locations.start.latitude, routeData.locations.start.longitude], { icon: bloodBankIcon })
      .addTo(map)
      .bindPopup(`<b>${routeData.locations.start.name}</b><br>${routeData.locations.start.address}`);

    // Add end marker (Hospital)
    L.marker([routeData.locations.end.latitude, routeData.locations.end.longitude], { icon: hospitalIcon })
      .addTo(map)
      .bindPopup(`<b>${routeData.locations.end.name}</b><br>${routeData.locations.end.address}`);

    // Add driver marker
    driverMarkerRef.current = L.marker([routeData.locations.start.latitude, routeData.locations.start.longitude], { icon: driverIcon })
      .addTo(map)
      .bindPopup(`<b>${routeData.driver.name}</b><br>Vehicle: ${routeData.driver.vehicle_number}`);

    // Draw route line
    const routeCoordinates = [
      [routeData.locations.start.latitude, routeData.locations.start.longitude],
      [routeData.locations.end.latitude, routeData.locations.end.longitude]
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

  if (!routeData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">No route data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Route Map
        </CardTitle>
        <CardDescription>
          {routeData.request.blood_type} blood delivery from {routeData.locations.start.name} to {routeData.locations.end.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600">Distance</div>
            <div className="font-semibold">{routeData.route.distance_km} km</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">ETA</div>
            <div className="font-semibold">{routeData.route.eta_minutes} min</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Status</div>
            <Badge variant={routeData.route.status === 'completed' ? 'default' : 'secondary'}>
              {routeData.route.status.toUpperCase()}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Progress</div>
            <div className="font-semibold">{routeData.tracking.progress_percentage}%</div>
          </div>
        </div>

        {/* Map */}
        <div 
          ref={mapRef} 
          className="w-full h-80 rounded-lg border"
        ></div>

        {/* Driver Actions (only for drivers) */}
        {userRole === 'driver' && (
          <div className="flex gap-3 justify-center">
            {routeData.route.status === 'pending' && (
              <Button 
                onClick={() => onStartRoute && onStartRoute(routeData.route.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Start Route
              </Button>
            )}
            
            {routeData.route.status === 'active' && (
              <Button 
                onClick={() => onCompleteRoute && onCompleteRoute(routeData.route.id)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Truck className="w-4 h-4 mr-2" />
                Complete Delivery
              </Button>
            )}
            
            {routeData.route.status === 'completed' && (
              <div className="text-center text-green-600 font-medium">
                ✅ Delivery Completed!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleRouteMap;
