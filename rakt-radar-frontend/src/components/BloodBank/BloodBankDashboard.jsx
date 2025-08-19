import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Droplets, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  Package,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SimpleRouteMap from '../SimpleRouteMap';

const API_BASE = '/api';

const BloodBankDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [user, setUser] = useState(null);
  const [entityDetails, setEntityDetails] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [routeTracking, setRouteTracking] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const entityData = localStorage.getItem('entity_details');
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    if (entityData) {
      setEntityDetails(JSON.parse(entityData));
    }

    fetchData();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchData();
      if (routeTracking) {
        fetchRouteTracking(routeTracking.request.id);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [routeTracking]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [requestsRes, inventoryRes] = await Promise.all([
        fetch(`${API_BASE}/emergency_requests`, {
          credentials: 'include'
        }),
        fetch(`${API_BASE}/blood_units?bankId=${entityDetails?.id}`, {
          credentials: 'include'
        })
      ]);

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData);
      }

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setInventory(inventoryData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRouteTracking = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/routes/tracking/${requestId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const trackingData = await response.json();
        setRouteTracking(trackingData);
        console.log('Route tracking data:', trackingData);
      } else {
        console.error('Failed to fetch route tracking');
      }
    } catch (error) {
      console.error('Error fetching route tracking:', error);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/emergency_requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Refresh data
        fetchData();
        
        // Fetch route tracking data for the approved request
        await fetchRouteTracking(requestId);
        
        // Show success message
        alert('Request approved successfully! Route has been created.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/emergency_requests/${requestId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Refresh data
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'created':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'en_route':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'created');
  const activeRequests = requests.filter(req => ['approved', 'en_route'].includes(req.status));
  const completedRequests = requests.filter(req => ['delivered', 'cancelled'].includes(req.status));

  const totalUnits = inventory.length;
  const availableUnits = inventory.filter(unit => unit.status === 'available').length;
  const reservedUnits = inventory.filter(unit => unit.status === 'reserved').length;
  const expiringUnits = inventory.filter(unit => unit.is_flagged_for_expiry).length;

  if (!user || !entityDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in as a blood bank user.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Blood Bank Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                {entityDetails?.name} • {entityDetails?.city}, {entityDetails?.state}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Droplets className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnits}</div>
              <p className="text-xs text-muted-foreground">
                Blood units in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{availableUnits}</div>
              <p className="text-xs text-muted-foreground">
                Ready for requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reserved</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{reservedUnits}</div>
              <p className="text-xs text-muted-foreground">
                Currently allocated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringUnits}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span>Pending Requests ({pendingRequests.length})</span>
            </CardTitle>
            <CardDescription>
              Emergency blood requests awaiting your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {request.blood_type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {request.quantity_ml}ml needed
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hospital</p>
                        <p className="text-sm text-gray-600">{request.hospital?.name}</p>
                        <p className="text-xs text-gray-500">{request.hospital?.city}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">ML Confidence</p>
                        <p className="text-sm text-green-600 font-semibold">
                          {request.ml_confidence_score?.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Predicted ETA</p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {request.predicted_eta_minutes} min
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mb-4 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700">{request.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApproveRequest(request.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleRejectRequest(request.id)}
                        size="sm"
                        variant="destructive"
                      >
                        Reject
                      </Button>
                      {request.status === 'approved' && (
                        <Button 
                          onClick={() => navigate(`/blood-bank/tracking/${request.id}`)}
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          View Tracking
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Active Deliveries ({activeRequests.length})</span>
            </CardTitle>
            <CardDescription>
              Blood units currently being delivered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No active deliveries</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {request.blood_type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {request.quantity_ml}ml
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.route?.started_at && 
                          `Started: ${new Date(request.route.started_at).toLocaleTimeString()}`
                        }
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hospital</p>
                        <p className="text-sm text-gray-600">{request.hospital?.name}</p>
                        <p className="text-xs text-gray-500">{request.hospital?.city}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Driver</p>
                        <p className="text-sm text-gray-600">{request.route?.driver_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Route Progress</p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {request.route?.progress_percent || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Completed Requests ({completedRequests.length})</span>
            </CardTitle>
            <CardDescription>
              Recently completed or cancelled requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No completed requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {request.blood_type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {request.quantity_ml}ml
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hospital</p>
                        <p className="text-sm text-gray-600">{request.hospital?.name}</p>
                        <p className="text-xs text-gray-500">{request.hospital?.city}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Status</p>
                        <p className="text-sm text-gray-600">
                          {request.status === 'delivered' ? 'Successfully delivered' : 'Request cancelled'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Tracking Section */}
        {routeTracking && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Route Tracking - {routeTracking.request.blood_type} Blood
              </CardTitle>
              <CardDescription>
                Live tracking for approved emergency request
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status Alert */}
              <div className={`p-4 rounded-lg mb-4 ${
                routeTracking.route.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                routeTracking.route.status === 'active' ? 'bg-blue-50 border border-blue-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-2">
                  {routeTracking.route.status === 'pending' && (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  {routeTracking.route.status === 'active' && (
                    <Navigation className="w-5 h-5 text-blue-600" />
                  )}
                  {routeTracking.route.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span className={`font-medium ${
                    routeTracking.route.status === 'pending' ? 'text-yellow-800' :
                    routeTracking.route.status === 'active' ? 'text-blue-800' :
                    'text-green-800'
                  }`}>
                    {routeTracking.route.status === 'pending' ? 'Driver Ready - Waiting to Start Route' :
                     routeTracking.route.status === 'active' ? 'Driver En Route - Delivery in Progress' :
                     'Delivery Completed Successfully'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Route Status */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Route Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant={routeTracking.route.status === 'completed' ? 'default' : 'secondary'}>
                        {routeTracking.route.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Distance:</span>
                      <span className="font-medium">{routeTracking.route.distance_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ETA:</span>
                      <span className="font-medium">{routeTracking.route.eta_minutes} min</span>
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Driver Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="font-medium">{routeTracking.driver.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vehicle:</span>
                      <span className="font-medium">{routeTracking.driver.vehicle_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="font-medium">{routeTracking.driver.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Tracking */}
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Progress:</span>
                      <span className="font-medium">{routeTracking.tracking.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${routeTracking.tracking.progress_percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className="font-medium">{routeTracking.tracking.remaining_distance_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ETA:</span>
                      <span className="font-medium">{routeTracking.tracking.estimated_remaining_time_minutes} min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Map Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Route Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">From (Blood Bank)</h5>
                    <div className="p-3 bg-white rounded border">
                      <div className="font-medium">{routeTracking.locations.start.name}</div>
                      <div className="text-sm text-gray-600">{routeTracking.locations.start.address}</div>
                      <div className="text-xs text-gray-500">
                        {routeTracking.locations.start.latitude.toFixed(4)}, {routeTracking.locations.start.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">To (Hospital)</h5>
                    <div className="p-3 bg-white rounded border">
                      <div className="font-medium">{routeTracking.locations.end.name}</div>
                      <div className="text-sm text-gray-600">{routeTracking.locations.end.address}</div>
                      <div className="text-xs text-gray-500">
                        {routeTracking.locations.end.latitude.toFixed(4)}, {routeTracking.locations.end.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Updates Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Live Updates</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Driver: {routeTracking.driver.name} | Vehicle: {routeTracking.driver.vehicle_number}
                  </div>
                  {routeTracking.route.status === 'active' && (
                    <div className="text-sm text-blue-600 font-medium">
                      🚚 Driver is currently en route to the hospital
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={() => fetchRouteTracking(routeTracking.request.id)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Tracking
                </Button>
                <Button 
                  onClick={() => setRouteTracking(null)}
                  variant="ghost"
                >
                  Close Tracking
                </Button>
                <Button 
                  onClick={() => setShowMap(!showMap)}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {showMap ? 'Hide Map' : 'View Map'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Map Section */}
        {showMap && routeTracking && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Route Map
              </CardTitle>
              <CardDescription>
                Visual route from blood bank to hospital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleRouteMap 
                routeData={routeTracking}
                userRole="blood_bank"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BloodBankDashboard;
