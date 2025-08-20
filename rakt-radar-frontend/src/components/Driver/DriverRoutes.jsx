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
  const [routeNotifications, setRouteNotifications] = useState([]);
  const [showRouteNotification, setShowRouteNotification] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🚚 Driver fetching routes from API...');
      
      // Fetch routes from API
      const response = await fetch(`${API_BASE}/routes`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiRoutes = await response.json();
      console.log('📡 API routes received:', apiRoutes);
      
      // Transform API routes to match expected format
      const transformedRoutes = apiRoutes.map(route => ({
        id: route.id,
        status: route.status,
        driver: { name: route.driver_name },
        start: {
          latitude: route.start_latitude,
          longitude: route.start_longitude,
          name: route.blood_bank?.name || 'Blood Bank'
        },
        destination: {
          latitude: route.end_latitude,
          longitude: route.end_longitude,
          name: route.hospital?.name || 'Hospital'
        },
        distance_km: route.distance_km,
        eta_minutes: route.eta_minutes,
        created_at: route.created_at,
        started_at: route.started_at,
        request: route.request
      }));
      
      console.log('🚚 Transformed routes:', transformedRoutes);
      
      // Check if there are new pending routes (notifications)
      const newPendingRoutes = transformedRoutes.filter(route => 
        route.status === 'pending' && 
        !routes.some(existingRoute => existingRoute.id === route.id)
      );
      
      if (newPendingRoutes.length > 0) {
        setNotificationMessage(`🚚 New route assigned! You have ${newPendingRoutes.length} new delivery request(s)`);
        setShowNotification(true);
      }
      
      // Always check localStorage for assigned routes (since we use mock routes)
      console.log('🔄 Checking localStorage for assigned routes...');
      const assignedRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      console.log('🔄 Assigned routes from localStorage:', assignedRoutes);
      
      // Filter routes for this driver
      const driverAssignedRoutes = assignedRoutes.filter(route => 
        route.driver.name === (user?.username || 'demo_driver')
      );
      console.log('🚚 Driver assigned routes:', driverAssignedRoutes);
      
      // Combine API routes with localStorage routes
      const allRoutes = [...transformedRoutes, ...driverAssignedRoutes];
      console.log('🚚 All routes combined:', allRoutes);
      
      setRoutes(allRoutes);
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching driver routes:', error);
      
      // Fallback to localStorage routes
      console.log('🔄 Falling back to localStorage routes...');
      const assignedRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      const driverAssignedRoutes = assignedRoutes.filter(route => 
        route.driver.name === (user?.username || 'demo_driver')
      );
      
      setRoutes(driverAssignedRoutes);
      setIsLoading(false);
    }
  };

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

    // Don't call fetchData here since it's not defined yet
    // We'll call it in the next useEffect after user/entity are set
    
    // Refresh data every 15 seconds for real-time updates
    const interval = setInterval(() => {
      if (typeof fetchData === 'function') {
        fetchData();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Call fetchData when user and entityDetails are set
  useEffect(() => {
    if (user && entityDetails) {
      console.log('🚚 Driver - User and entity details ready, calling fetchData...');
      fetchData();
    }
  }, [user, entityDetails, fetchData]);

  // Monitor for route notifications (both route assignments and route starts)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simple check for route approval
      const routeApproved = localStorage.getItem('routeApproved');
      const routeApprovedAt = localStorage.getItem('routeApprovedAt');
      
      if (routeApproved === 'true' && routeApprovedAt) {
        const approvedTime = new Date(routeApprovedAt);
        const now = new Date();
        const timeDiff = now - approvedTime;
        
        // Only redirect if the approval was recent (within last 30 seconds)
        if (timeDiff < 30000) {
          console.log('🚚 Driver - Route approved detected! Redirecting to tracking...');
          
          // Clear the flag
          localStorage.removeItem('routeApproved');
          localStorage.removeItem('routeApprovedAt');
          
          // Show loading screen and redirect
          setShowLoadingScreen(true);
          
          setTimeout(() => {
            console.log('🚀 Redirecting driver to tracking page...');
            navigate('/tracking');
          }, 2000);
        }
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [navigate]);

  const handleStartRoute = async (routeId) => {
    try {
      // Find the route in current routes state
      const currentRoute = routes.find(route => route.id === routeId);
      
      if (!currentRoute) {
        console.error('❌ Route not found:', routeId);
        return;
      }
      
      console.log('🚚 Starting route:', currentRoute);
      
      // Call API to start the route
      const response = await fetch(`${API_BASE}/routes/${routeId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start route: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🚚 Route start API response:', result);
      
      // Update local state
      const updatedRoutes = routes.map(route => {
        if (route.id === routeId) {
          return { ...route, status: 'active', started_at: new Date().toISOString() };
        }
        return route;
      });
      setRoutes(updatedRoutes);
      
      // Use the route start notification from the backend API response
      let routeStartNotification;
      if (result.route_start_notification) {
        // Use the comprehensive notification from backend
        routeStartNotification = {
          id: result.route_start_notification.id,
          type: result.route_start_notification.type,
          route_id: result.route_start_notification.route_id,
          request_id: result.route_start_notification.request_id,
          driver_name: result.route_start_notification.driver_name,
          blood_type: result.route_start_notification.blood_type,
          quantity_ml: result.route_start_notification.quantity_ml,
          urgency: result.route_start_notification.urgency,
          hospital_name: result.route_start_notification.hospital_name,
          blood_bank_name: result.route_start_notification.blood_bank_name,
          distance_km: result.route_start_notification.distance_km,
          eta_minutes: result.route_start_notification.eta_minutes,
          start_latitude: result.route_start_notification.start_latitude,
          start_longitude: result.route_start_notification.start_longitude,
          end_latitude: result.route_start_notification.end_latitude,
          end_longitude: result.route_start_notification.end_longitude,
          timestamp: result.route_start_notification.timestamp,
          status: result.route_start_notification.status,
          message: result.route_start_notification.message,
          for_users: result.route_start_notification.for_users
        };
      } else {
        // Fallback notification if backend doesn't provide one
        routeStartNotification = {
          id: `route_start_${routeId}`,
          type: 'route_started',
          route_id: routeId,
          routeData: currentRoute,
          timestamp: new Date().toISOString(),
          message: `🚚 Blood delivery route started! Driver ${currentRoute.driver?.name || 'Unknown'} is now en route to ${currentRoute.destination?.name || 'Hospital'}`,
          for_users: ['hospital', 'blood_bank', 'driver'],
          status: 'active'
        };
      }
      
      // Store notification in localStorage for all users to see
      const existingNotifications = JSON.parse(localStorage.getItem('routeNotifications') || '[]');
      console.log('🚚 Existing notifications:', existingNotifications);
      
      // Clear old notifications to prevent duplicates
      const activeNotifications = existingNotifications.filter(n => n.status === 'active');
      if (activeNotifications.length > 0) {
        console.log('🚚 Clearing old notifications to prevent duplicates');
      }
      
      existingNotifications.push(routeStartNotification);
      localStorage.setItem('routeNotifications', JSON.stringify(existingNotifications));
      
      console.log('🚚 Route start notification created for all users:', routeStartNotification);
      console.log('🚚 All notifications in localStorage:', existingNotifications);
      
      // Create a global notification for route start that all pages can see
      const globalRouteStartNotification = {
        id: `global_route_start_${routeId}`,
        type: 'route_started',
        route_id: routeId,
        routeData: currentRoute,
        timestamp: new Date().toISOString(),
        message: `🚚 Blood delivery route started! Driver ${currentRoute.driver?.name || 'Unknown'} is now en route to ${currentRoute.destination?.name || 'Hospital'}`,
        for_users: ['hospital', 'blood_bank', 'driver'],
        status: 'active'
      };
      
      // Store global notification
      const globalNotifications = JSON.parse(localStorage.getItem('globalNotifications') || '[]');
      globalNotifications.push(globalRouteStartNotification);
      localStorage.setItem('globalNotifications', JSON.stringify(globalNotifications));
      
      // Dispatch global event for cross-tab communication
      window.dispatchEvent(new CustomEvent('globalRouteStarted', { 
        detail: { 
          notification: globalRouteStartNotification,
          routeData: currentRoute 
        } 
      }));
      console.log('📡 Global route started event dispatched');
      
      // Also dispatch storage event for cross-tab communication
      const storageEvent = new StorageEvent('storage', {
        key: 'globalNotifications',
        newValue: JSON.stringify(globalNotifications),
        oldValue: JSON.stringify(globalNotifications.slice(0, -1)),
        url: window.location.href
      });
      window.dispatchEvent(storageEvent);
      console.log('📡 Storage event dispatched for route start');
      
      console.log('🚚 About to navigate to tracking page with state:', { routeId: routeId, routeData: currentRoute });
      
      // Navigate to tracking page
      navigate('/tracking', { 
        state: { 
          routeId: routeId,
          routeData: currentRoute 
        } 
      });
      
      console.log('🚚 Navigation completed');
      
      alert('Route started successfully! 🚚\n\n✅ Driver: Redirecting to tracking...\n✅ Hospital: Will be notified and redirected to tracking\n✅ Blood Bank: Will be notified and redirected to tracking\n\nAll users will now see live GPS tracking!');
      return;
    } catch (error) {
      console.error('❌ Error starting route:', error);
      alert('Error starting route');
    }
  };

  const handleCompleteRoute = async (routeId) => {
    try {
      console.log('🚚 Completing route:', routeId);
      
      // For demo purposes, update localStorage instead of API call
      const assignedRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      const updatedRoutes = assignedRoutes.map(route => {
        if (route.id === routeId) {
          return { ...route, status: 'completed', completed_at: new Date().toISOString() };
        }
        return route;
      });
      localStorage.setItem('assignedRoutes', JSON.stringify(updatedRoutes));
      
      console.log('✅ Route completed in localStorage');
      
      // Refresh data
      fetchData();
      
      alert('Route completed successfully! 🎉');
    } catch (error) {
      console.error('Error completing route:', error);
      alert('Error completing route');
    }
  };

  const handleUpdateProgress = async (routeId) => {
    try {
      console.log('🚚 Updating progress for route:', routeId);
      
      // For demo purposes, simulate progress update in localStorage
      const assignedRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      const updatedRoutes = assignedRoutes.map(route => {
        if (route.id === routeId) {
          // Simulate progress update
          const currentProgress = route.progress || 0;
          const newProgress = Math.min(currentProgress + Math.random() * 20, 100);
          return { ...route, progress: newProgress };
        }
        return route;
      });
      localStorage.setItem('assignedRoutes', JSON.stringify(updatedRoutes));
      
      console.log('✅ Progress updated in localStorage');
      
      // Refresh data
      fetchData();
      
      alert('Progress updated successfully! 📊');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress');
    }
  };

  const handleViewMap = async (route) => {
    setSelectedRoute(route);
    
    try {
      console.log('🗺️ Viewing map for route:', route);
      
      // For demo purposes, use route data directly instead of API call
      if (route) {
        setRouteTrackingData(route);
        console.log('✅ Route data set for map view');
      } else {
        console.error('No route data available');
      }
    } catch (error) {
      console.error('Error setting route data for map:', error);
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
      {/* Route Start Notification */}
      {showRouteNotification && routeNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🚚</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">Route Started!</h3>
                <p className="text-sm text-green-700 mt-1">
                  {routeNotifications[routeNotifications.length - 1]?.message || 'Your route has started'}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Redirecting to live tracking in 2 seconds...
                </p>
              </div>
              <button
                onClick={() => setShowRouteNotification(false)}
                className="text-green-400 hover:text-green-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {showLoadingScreen && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <Truck className="w-16 h-16 text-blue-500 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Route Approved!</h2>
            <p className="text-gray-600 mt-2">Redirecting to tracking page...</p>
          </div>
        </div>
      )}

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

        {/* Debug Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🐛 Debug Panel
            </CardTitle>
            <CardDescription>
              Debug information for troubleshooting notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Current User:</h4>
                <p className="text-sm text-gray-600">
                  Username: {user?.username || 'Not set'}<br/>
                  Role: {user?.role || 'Not set'}<br/>
                  Entity ID: {user?.entity_id || 'Not set'}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Notification Status:</h4>
                <p className="text-sm text-gray-600">
                  Global Notifications: {JSON.parse(localStorage.getItem('globalNotifications') || '[]').length}<br/>
                  Test Notifications: {JSON.parse(localStorage.getItem('testNotifications') || '[]').length}<br/>
                  Route Notifications: {JSON.parse(localStorage.getItem('routeNotifications') || '[]').length}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Recent Notifications:</h4>
                <div className="max-h-32 overflow-y-auto text-xs text-gray-600">
                  {JSON.parse(localStorage.getItem('globalNotifications') || '[]').slice(-3).map((n, i) => (
                    <div key={i} className="mb-1 p-1 bg-gray-100 rounded">
                      {n.type}: {n.status} - {new Date(n.timestamp).toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  console.log('🐛 Debug: Current localStorage state:');
                  console.log('🐛 globalNotifications:', localStorage.getItem('globalNotifications'));
                  console.log('🐛 testNotifications:', localStorage.getItem('testNotifications'));
                  console.log('🐛 routeNotifications:', localStorage.getItem('routeNotifications'));
                  console.log('🐛 assignedRoutes:', localStorage.getItem('assignedRoutes'));
                  alert('🐛 Check console for debug information');
                }}
                className="bg-gray-600 hover:bg-gray-700"
              >
                🐛 Show Debug Info in Console
              </Button>
              
              <Button 
                onClick={() => {
                  console.log('🧪 Testing basic event system...');
                  
                  // Test if we can dispatch and receive events
                  const testEvent = new CustomEvent('testEvent', { detail: 'Hello from test button!' });
                  window.dispatchEvent(testEvent);
                  
                  // Test if we can access localStorage
                  try {
                    localStorage.setItem('testKey', 'testValue');
                    const testValue = localStorage.getItem('testKey');
                    localStorage.removeItem('testKey');
                    console.log('✅ localStorage test passed:', testValue);
                  } catch (e) {
                    console.error('❌ localStorage test failed:', e);
                  }
                  
                  alert('🧪 Basic system test completed! Check console for results.');
                }}
                className="bg-green-600 hover:bg-green-700 ml-2"
              >
                🧪 Test Basic System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Tracking Page */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">🧪 Test Tracking Page</h3>
          <p className="text-green-700 mb-3">Test the tracking page with sample data</p>
          <button
            onClick={() => {
              console.log('🧪 Testing tracking page...');
              const testRouteData = {
                id: 'test_route_123',
                blood_type: 'O+',
                quantity_ml: 500,
                source: {
                  name: 'Test Blood Bank',
                  latitude: 13.0827,
                  longitude: 80.2707
                },
                destination: {
                  name: 'Test Hospital',
                  latitude: 13.0569,
                  longitude: 80.2425
                },
                driver: {
                  name: 'Test Driver',
                  phone: '+91 98765 43210',
                  vehicle_number: 'TN-01-AB-1234'
                },
                status: 'pending',
                eta_minutes: 25,
                distance_km: 15,
                created_at: new Date().toISOString()
              };
              
              // Store test data
              localStorage.setItem('approvedRouteData', JSON.stringify(testRouteData));
              
              // Navigate to tracking page
              navigate('/tracking');
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            🧪 Test Tracking Page
          </button>
        </div>

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
