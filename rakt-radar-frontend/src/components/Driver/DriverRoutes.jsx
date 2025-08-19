import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Route, 
  Play, 
  CheckCircle, 
  Navigation,
  RefreshCw,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SimpleRouteMap from '../SimpleRouteMap';

const API_BASE = '/api';

const DriverRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [user, setUser] = useState(null);
  const [entityDetails, setEntityDetails] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeTrackingData, setRouteTrackingData] = useState(null);
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
    
    // Refresh data every 15 seconds for real-time updates
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🚚 Driver fetching routes...');
      const response = await fetch(`${API_BASE}/routes`, {
        credentials: 'include'
      });

      if (response.ok) {
        const routesData = await response.json();
        console.log('📡 Driver routes response:', routesData);
        
        // Check if there are new pending routes (notifications)
        const newPendingRoutes = routesData.filter(route => 
          route.status === 'pending' && 
          !routes.some(existingRoute => existingRoute.id === route.id)
        );
        
        if (newPendingRoutes.length > 0) {
          setNotificationMessage(`🚚 New route assigned! You have ${newPendingRoutes.length} new delivery request(s)`);
          setShowNotification(true);
        }
        
        setRoutes(routesData);
      } else {
        console.error('❌ Failed to fetch routes:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error fetching routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRoute = async (routeId) => {
    try {
      const response = await fetch(`${API_BASE}/routes/${routeId}/start`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Route start result:', result);
        
        if (result.message === 'Route is already active') {
          // Route is already active, just refresh the data
          alert('Route is already active!');
        } else {
          alert('Route started successfully!');
        }
        
        // Refresh data
        fetchData();
      } else {
        const error = await response.json();
        console.error('❌ Route start error:', error);
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error starting route:', error);
      alert('Error starting route');
    }
  };

  const handleCompleteRoute = async (routeId) => {
    try {
      const response = await fetch(`${API_BASE}/routes/${routeId}/complete`, {
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
      console.error('Error completing route:', error);
      alert('Error completing route');
    }
  };

  const handleUpdateProgress = async (routeId) => {
    try {
      const response = await fetch(`${API_BASE}/routes/${routeId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ latitude: 0, longitude: 0 }) // Placeholder for now
      });

      if (response.ok) {
        // Refresh data
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress');
    }
  };

  const handleViewMap = async (route) => {
    setSelectedRoute(route);
    
    try {
      // Fetch detailed tracking data for this route
      const response = await fetch(`${API_BASE}/routes/tracking/${route.request_id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const trackingData = await response.json();
        setRouteTrackingData(trackingData);
      } else {
        console.error('Failed to fetch tracking data');
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  const handleCloseMap = () => {
    setSelectedRoute(null);
    setRouteTrackingData(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
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

  const pendingRoutes = routes.filter(route => route.status === 'pending');
  const activeRoutes = routes.filter(route => route.status === 'active');
  const completedRoutes = routes.filter(route => route.status === 'completed');

  if (!user || !entityDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in as a driver.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Driver Routes</h1>
            <p className="text-gray-600">Manage your assigned delivery routes</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {entityDetails?.name || user?.username}
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {showNotification && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-800 font-medium">{notificationMessage}</span>
              </div>
              <Button 
                onClick={() => setShowNotification(false)}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Routes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingRoutes.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready to start
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeRoutes.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently delivering
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedRoutes.length}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span>Pending Routes ({pendingRoutes.length})</span>
            </CardTitle>
            <CardDescription>
              Routes ready to be started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRoutes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending routes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRoutes.map((route) => (
                  <div key={route.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={getUrgencyColor(route.request?.urgency)}>
                          {route.request?.urgency?.toUpperCase() || 'HIGH'}
                        </Badge>
                        <Badge variant="outline">
                          {route.request?.blood_type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {route.request?.quantity_ml}ml
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">Distance</p>
                        <p className="text-lg font-bold text-blue-600">
                          {route.distance_km?.toFixed(1)} km
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">From (Blood Bank)</p>
                        <p className="text-sm text-gray-600">{route.blood_bank?.name}</p>
                        <p className="text-xs text-gray-500">{route.blood_bank?.city}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">To (Hospital)</p>
                        <p className="text-sm text-gray-600">{route.hospital?.name}</p>
                        <p className="text-xs text-gray-500">{route.hospital?.city}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Predicted ETA</p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {route.eta_minutes} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Route Status</p>
                        <Badge className={getStatusColor(route.status)}>
                          {route.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {route.status === 'pending' && (
                        <Button 
                          onClick={() => handleStartRoute(route.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Start Route
                        </Button>
                      )}
                      {route.status === 'active' && (
                        <>
                          <Button 
                            onClick={() => handleUpdateProgress(route.id)}
                            size="sm"
                            variant="outline"
                          >
                            Update Progress
                          </Button>
                          <Button 
                            onClick={() => handleCompleteRoute(route.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      <Button 
                        onClick={() => handleViewMap(route)}
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        View Map
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Active Routes ({activeRoutes.length})</span>
            </CardTitle>
            <CardDescription>
              Currently delivering blood units
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeRoutes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No active routes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRoutes.map((route) => (
                  <div key={route.id} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={getUrgencyColor(route.request?.urgency)}>
                          {route.request?.urgency?.toUpperCase() || 'HIGH'}
                        </Badge>
                        <Badge variant="outline">
                          {route.request?.blood_type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {route.request?.quantity_ml}ml
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">Progress</p>
                        <p className="text-lg font-bold text-blue-600">
                          {route.progress_percent || 0}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">From (Blood Bank)</p>
                        <p className="text-sm text-gray-600">{route.blood_bank?.name}</p>
                        <p className="text-xs text-gray-500">{route.blood_bank?.city}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">To (Hospital)</p>
                        <p className="text-sm text-gray-600">{route.hospital?.name}</p>
                        <p className="text-xs text-gray-500">{route.hospital?.city}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Route Progress</span>
                        <span>{route.distance_covered_km || 0} / {route.distance_km} km</span>
                      </div>
                      <Progress value={route.progress_percent || 0} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Started At</p>
                        <p className="text-sm text-gray-600">
                          {route.started_at ? new Date(route.started_at).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Remaining ETA</p>
                        <p className="text-sm text-orange-600 font-semibold">
                          {route.remaining_eta_minutes || 'Calculating...'} min
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Route Status</p>
                        <Badge className={getStatusColor(route.status)}>
                          {route.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleCompleteRoute(route.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Delivered
                      </Button>
                      <Button variant="outline">
                        <Navigation className="w-4 h-4 mr-2" />
                        Update Location
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Completed Routes ({completedRoutes.length})</span>
            </CardTitle>
            <CardDescription>
              Recently completed deliveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedRoutes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No completed routes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedRoutes.slice(0, 5).map((route) => (
                  <div key={route.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(route.status)}>
                          {route.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {route.request?.blood_type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {route.request?.quantity_ml}ml
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {route.completed_at && 
                          `Completed: ${new Date(route.completed_at).toLocaleString()}`
                        }
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">From</p>
                        <p className="text-sm text-gray-600">{route.blood_bank?.name}</p>
                        <p className="text-xs text-gray-500">{route.blood_bank?.city}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">To</p>
                        <p className="text-sm text-gray-600">{route.hospital?.name}</p>
                        <p className="text-xs text-gray-500">{route.hospital?.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Map Section */}
        {selectedRoute && routeTrackingData && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Route Map</h2>
              <Button onClick={handleCloseMap} variant="outline">
                Close Map
              </Button>
            </div>
            <SimpleRouteMap 
              routeData={routeTrackingData}
              userRole="driver"
              onStartRoute={handleStartRoute}
              onCompleteRoute={handleCompleteRoute}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRoutes;
