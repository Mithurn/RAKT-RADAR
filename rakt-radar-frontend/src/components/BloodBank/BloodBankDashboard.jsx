import React, { useState, useEffect, useCallback } from 'react';
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
import { generateUniqueId } from '../../lib/utils';

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
  const [pendingBloodRequests, setPendingBloodRequests] = useState([]);
  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [routeNotifications, setRouteNotifications] = useState([]);
  const [showRouteNotification, setShowRouteNotification] = useState(false);

  const navigate = useNavigate();

  // Define fetchData first using useCallback (before any useEffect that uses it)
  const fetchData = useCallback(async () => {
    if (!user || !entityDetails) {
      console.log('❌ fetchData called without user or entity details');
      return;
    }

    console.log('🔍 Blood Bank - fetchData called with user:', user.role, 'entity:', entityDetails.name);
    
    try {
      if (user.role === 'blood_bank' && entityDetails.id) {
        // Try to fetch from backend API first
        console.log('🏥 Blood Bank - Attempting to fetch from backend API...');
        
        try {
          console.log('🔍 Blood Bank - Making API call to /api/demo/emergency_requests...');
          console.log('🔍 Blood Bank - Current entityDetails.id:', entityDetails.id);
          
          const response = await fetch('/api/demo/emergency_requests', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          console.log('🔍 Blood Bank - API response received:', response.status, response.statusText);
          
          if (response.ok) {
            const requests = await response.json();
            console.log('🔍 Blood Bank - Backend API response:', requests);
            console.log('🔍 Blood Bank - Total requests received:', requests.length);
            
            // Filter requests for this blood bank (where suggested_bank_id matches)
            const pendingRequests = requests.filter(request => {
              // Include both 'created' and 'pending_approval' statuses
              const validStatuses = ['created', 'pending_approval'];
              const matches = validStatuses.includes(request.status) && 
                            request.suggested_bank_id === entityDetails.id;
              console.log(`🔍 Blood Bank - Request ${request.id}: status=${request.status}, suggested_bank_id=${request.suggested_bank_id}, matches=${matches}`);
              return matches;
            });
            
            console.log('🔍 Blood Bank - Pending requests from API:', pendingRequests);
            console.log('🔍 Blood Bank - Setting pendingBloodRequests state with', pendingRequests.length, 'requests');
            setPendingBloodRequests(pendingRequests);
            
            // Debug: Check what's in the state after setting
            setTimeout(() => {
              console.log('🔍 Blood Bank - State after setPendingBloodRequests:', pendingRequests);
            }, 100);
            
            // Also store in localStorage for other components
            localStorage.setItem('bloodRequests', JSON.stringify(requests));
            
          } else {
            console.error('❌ Backend API error:', response.status, response.statusText);
            // Fallback to localStorage if API fails
            fallbackToLocalStorage();
          }
        } catch (apiError) {
          console.error('❌ API call failed:', apiError);
          if (apiError.name === 'TimeoutError') {
            console.error('❌ API call timed out after 10 seconds');
          }
          // Fallback to localStorage if API fails
          fallbackToLocalStorage();
        }
      } else {
        console.log('🏥 Blood Bank - Using localStorage fallback');
        fallbackToLocalStorage();
      }
      
      // Load assigned routes from localStorage
      const assignedRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      console.log('🔍 Blood Bank - Assigned routes from localStorage:', assignedRoutes);
      setAssignedRoutes(assignedRoutes);
      
      // Load route tracking data
      const routeTrackingData = JSON.parse(localStorage.getItem('routeTracking') || 'null');
      if (routeTrackingData) {
        console.log('🔍 Blood Bank - Route tracking data from localStorage:', routeTrackingData);
        setRouteTracking(routeTrackingData);
      } else {
        console.log('🔍 Blood Bank - No route tracking data in localStorage');
      }
      
      console.log('✅ fetchData completed successfully');
      
    } catch (error) {
      console.error('❌ Error in fetchData:', error);
      fallbackToLocalStorage();
    }
  }, [user, entityDetails]);
  
  const fallbackToLocalStorage = () => {
    console.log('🔄 Blood Bank - Using localStorage fallback');
    const allBloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
    console.log('🔍 Blood Bank - All blood requests from localStorage:', allBloodRequests);
    
    // Use the same filtering logic as the API
    const validStatuses = ['created', 'pending_approval'];
    const pendingRequests = allBloodRequests.filter(request => 
      validStatuses.includes(request.status) && 
      request.blood_bank_id === entityDetails.id
    );
    
    console.log('🔍 Blood Bank - Pending requests from localStorage:', pendingRequests);
    setPendingBloodRequests(pendingRequests);
  };

  useEffect(() => {
    console.log('🏥 Blood Bank - useEffect started');
    
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const entityData = localStorage.getItem('entity_details');
    
    let shouldFetchData = true;
    
    if (userData) {
      const user = JSON.parse(userData);
      setUser(user);
      console.log('🏥 Blood Bank - User loaded from localStorage:', user);
    } else {
      // For demo purposes, create a demo blood bank user
      const demoUser = {
        id: 'demo_blood_bank_user',
        username: 'blood_bank_admin',
        role: 'blood_bank',
        entity_id: '52421b7d-0ce1-4382-ba82-cf9af817761d'
      };
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
      console.log('🏥 Blood Bank - Demo user created:', demoUser);
    }
    
    if (entityData) {
      const entity = JSON.parse(entityData);
      setEntityDetails(entity);
      console.log('🏥 Blood Bank - Entity loaded from localStorage:', entity);
    } else {
      // For demo purposes, create demo entity details
      const demoEntity = {
        id: '52421b7d-0ce1-4382-ba82-cf9af817761d',
        name: 'SRM Blood Bank',
        city: 'Chengalpattu',
        state: 'Tamil Nadu',
        address: 'SRM Nagar, Kattankulathur, Chengalpattu District',
        contact_person: 'Dr. Priya Venkat',
        contact_email: 'bloodbank@srmglobalhospitals.com',
        contact_phone: '+91-44-27452222'
      };
      setEntityDetails(demoEntity);
      localStorage.setItem('entity_details', JSON.stringify(demoEntity));
      console.log('🏥 Blood Bank - Demo entity created:', demoEntity);
    }

    // Don't call fetchData here - we'll call it when user and entityDetails are set
    console.log('🏥 Blood Bank - User and entity setup complete, waiting for state update...');
  }, []); // Empty dependency array - only run once on mount

  // Call fetchData when user and entityDetails are set
  useEffect(() => {
    if (user && entityDetails) {
      console.log('🏥 Blood Bank - User and entity details ready, calling fetchData...');
      fetchData();
    }
  }, [user, entityDetails, fetchData]);

  // Clean up old data and monitor for localStorage changes
  useEffect(() => {
    // Clean up old blood requests that might have wrong structure
    const cleanOldData = () => {
      const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
      const cleanedRequests = bloodRequests.filter(request => 
        request.status === 'pending_approval' || 
        (request.blood_bank_id && request.blood_bank_id !== 'demo_bank_1')
      );
      
      if (cleanedRequests.length !== bloodRequests.length) {
        console.log('🧹 Cleaning up old blood requests data...');
        localStorage.setItem('bloodRequests', JSON.stringify(cleanedRequests));
      }
    };
    
    cleanOldData();
    
    // Set up periodic refresh every 10 seconds to check for new requests
    const refreshInterval = setInterval(() => {
      console.log('🔄 Periodic refresh checking for new requests...');
      fetchData();
    }, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
    
    const handleStorageChange = (e) => {
      console.log('🔄 Storage change detected:', e.key, e.newValue);
      if (e.key === 'bloodRequests' || e.key === 'routeNotifications' || e.key === 'bloodRequestsUpdate') {
        console.log('🔄 Relevant storage change detected, refreshing data...');
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      console.log('🔄 Custom storage change detected, refreshing data...');
      fetchData();
    };
    
    window.addEventListener('customStorageChange', handleCustomStorageChange);
    
    // Listen for BroadcastChannel messages from other tabs
    let broadcastChannel = null;
    try {
      if (window.BroadcastChannel) {
        broadcastChannel = new BroadcastChannel('rakt-radar-updates');
        broadcastChannel.onmessage = (event) => {
          console.log('📡 BroadcastChannel message received:', event.data);
          if (event.data.type === 'new_blood_request') {
            console.log('🔄 New blood request notification received, refreshing data...');
            fetchData();
          }
        };
        console.log('📡 BroadcastChannel listener set up');
      }
    } catch (e) {
      console.log('Could not set up BroadcastChannel listener:', e);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customStorageChange', handleCustomStorageChange);
    };
  }, [fetchData]);

  // Monitor for route start notifications and redirect to tracking
  useEffect(() => {
    const checkRouteNotifications = () => {
      const notifications = JSON.parse(localStorage.getItem('routeNotifications') || '[]');
      
      // Check for new blood request notifications
      const newBloodRequestNotifications = notifications.filter(n => 
        n.status === 'active' && 
        n.type === 'new_blood_request' &&
        new Date(n.timestamp) > new Date(Date.now() - 60000) // Only notifications from last minute
      );
      
      if (newBloodRequestNotifications.length > 0) {
        console.log('🔔 Blood Bank - New blood request notifications found:', newBloodRequestNotifications);
        // Refresh data to show new requests
        if (user && entityDetails) {
          fetchData();
        }
        
        // Mark notifications as processed
        const updatedNotifications = notifications.map(n => 
          n.type === 'new_blood_request' ? { ...n, status: 'processed' } : n
        );
        localStorage.setItem('routeNotifications', JSON.stringify(updatedNotifications));
      }
      
      // Check for route start notifications
      const activeNotifications = notifications.filter(n => 
        n.status === 'active' && 
        n.type === 'route_started' &&
        new Date(n.timestamp) > new Date(Date.now() - 60000) // Only notifications from last minute
      );
      
      if (activeNotifications.length > 0) {
        const latestNotification = activeNotifications[activeNotifications.length - 1];
        console.log('🏥 Blood Bank - Route start notification detected:', latestNotification);
        
        // Show notification to user
        setRouteNotifications(activeNotifications);
        setShowRouteNotification(true);
        
        // Refresh route data immediately when route starts
        console.log('🔄 Blood Bank - Refreshing route data after route start...');
        fetchData();
        
        // Auto-redirect to tracking after 3 seconds
        setTimeout(() => {
          console.log('🏥 Blood Bank - Auto-redirecting to tracking page...');
          
          // Mark notification as processed
          const updatedNotifications = notifications.map(n => 
            n.id === latestNotification.id ? { ...n, status: 'processed' } : n
          );
          localStorage.setItem('routeNotifications', JSON.stringify(updatedNotifications));
          
          navigate('/tracking');
        }, 3000);
      }
    };

    // Check immediately and then every 2 seconds
    checkRouteNotifications();
    const interval = setInterval(checkRouteNotifications, 2000);
    
    return () => clearInterval(interval);
  }, [navigate, user, entityDetails, fetchData]);

  // Debug: Monitor pendingBloodRequests state changes
  useEffect(() => {
    console.log('🔍 Blood Bank - pendingBloodRequests state changed:', pendingBloodRequests);
  }, [pendingBloodRequests]);



  // Call fetchData when user and entityDetails are properly set
  useEffect(() => {
    if (user && entityDetails) {
      console.log('✅ User and entityDetails are set, calling fetchData');
      console.log('✅ User:', user);
      console.log('✅ Entity:', entityDetails);
      fetchData();
    } else {
      console.log('⏳ Waiting for user and entityDetails to be set...');
    }
  }, [user, entityDetails, fetchData]);

  // Set up auto-refresh and visibility change handler when user and entityDetails are available
  useEffect(() => {
    if (!user || !entityDetails) {
      console.log('⏳ Auto-refresh setup: Waiting for user and entity details...');
      return;
    }

    console.log('✅ Setting up auto-refresh and visibility change handler...');
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh: User and entity details available, refreshing data...');
      fetchData();
      if (routeTracking) {
        fetchRouteTracking(routeTracking.request.id);
      }
    }, 10000);
    
    // Also refresh when the page becomes visible (for when hospital creates request)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Visibility change: User and entity details available, refreshing data...');
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log('🧹 Cleaning up auto-refresh and visibility change handler...');
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, entityDetails, fetchData, routeTracking]);



  const fetchRouteTracking = async (requestId) => {
    try {
      console.log('🏥 Blood Bank - fetchRouteTracking called for request:', requestId);
      
      // For demo purposes, skip API call
      console.log('🏥 Blood Bank - Skipping API call, using localStorage data');
      
      // Get route data from localStorage instead
      const assignedRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      const routeData = assignedRoutes.find(route => route.request_id === requestId);
      
      if (routeData) {
        setRouteTracking({ request: routeData });
        console.log('✅ Route tracking data set from localStorage:', routeData);
      } else {
        console.log('❌ No route data found for request:', requestId);
      }
    } catch (error) {
      console.error('Error in fetchRouteTracking:', error);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      console.log('🏥 Blood Bank - Approving request:', requestId);
      
      // Update request status in localStorage
      const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
      const updatedRequests = bloodRequests.map(req => {
        if (req.id === requestId) {
          return { ...req, status: 'approved', approved_at: new Date().toISOString() };
        }
        return req;
      });
      localStorage.setItem('bloodRequests', JSON.stringify(updatedRequests));

      // Create a route assignment for the driver
      const approvedRequest = updatedRequests.find(req => req.id === requestId);
      const routeData = {
        id: generateUniqueId(),
        request_id: requestId,
        blood_type: approvedRequest.blood_type,
        quantity_ml: approvedRequest.quantity_ml,
        source: {
          name: approvedRequest.blood_bank_name,
          address: 'Chennai Central Blood Bank, Anna Salai, Chennai',
          latitude: 13.0827,
          longitude: 80.2707
        },
        destination: {
          name: approvedRequest.hospital.name,
          address: 'Hospital Address, Chennai',
          latitude: 13.0569,
          longitude: 80.2425
        },
        driver: {
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          vehicle_number: 'TN-01-AB-1234'
        },
        status: 'assigned',
        created_at: new Date().toISOString(),
        distance_km: approvedRequest.distance_km || 15,
        eta_minutes: approvedRequest.predicted_eta_minutes || 25,
        start_latitude: 13.0827,
        start_longitude: 80.2707,
        end_latitude: 13.0569,
        end_longitude: 80.2425
      };

      // Store route data
      const existingRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      existingRoutes.push(routeData);
      localStorage.setItem('assignedRoutes', JSON.stringify(existingRoutes));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('customStorageChange'));

      // Refresh data
      fetchData();
      
      // Show success message
      alert('Request approved successfully! Route has been created.');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log('🏥 Blood Bank - Rejecting request:', requestId);
      
      // For demo purposes, skip API call
      console.log('🏥 Blood Bank - Skipping API call, using localStorage only');
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  const handleApproveBloodRequest = async (requestId) => {
    try {
      console.log('🏥 Blood Bank - Approving request via API:', requestId);
      
      // Call the DEMO API endpoint to approve the request (no authentication required)
      const response = await fetch(`/api/demo/emergency_requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('🏥 Blood Bank - API approval response:', result);
      
      if (result.success) {
        // Create driver notification for the approved request
        if (result.driver_notification) {
          const driverNotification = {
            id: result.driver_notification.id,
            type: 'route_assigned',
            route_id: result.route.id,
            request_id: requestId,
            driver_name: result.driver_notification.driver_name,
            blood_type: result.driver_notification.blood_type,
            quantity_ml: result.driver_notification.quantity_ml,
            urgency: result.driver_notification.urgency,
            hospital_name: result.driver_notification.hospital_name,
            blood_bank_name: result.driver_notification.blood_bank_name,
            distance_km: result.driver_notification.distance_km,
            eta_minutes: result.driver_notification.eta_minutes,
            timestamp: result.driver_notification.timestamp,
            status: 'active',
            message: result.driver_notification.message
          };
          
          // Store notification in localStorage for driver to access
          const existingNotifications = JSON.parse(localStorage.getItem('routeNotifications') || '[]');
          existingNotifications.push(driverNotification);
          localStorage.setItem('routeNotifications', JSON.stringify(existingNotifications));
          
          console.log('🔔 Driver notification stored:', driverNotification);
          
          // Also store the route data for tracking
          const routeData = {
            id: result.route.id,
            request_id: requestId,
            blood_type: result.driver_notification.blood_type,
            quantity_ml: result.driver_notification.quantity_ml,
            source: {
              name: result.driver_notification.blood_bank_name,
              address: 'Blood Bank Address',
              latitude: result.route.start_latitude,
              longitude: result.route.start_longitude
            },
            destination: {
              name: result.driver_notification.hospital_name,
              address: 'Hospital Address',
              latitude: result.route.end_latitude,
              longitude: result.route.end_longitude
            },
            driver: {
              name: result.driver_notification.driver_name,
              phone: result.driver.phone || '+91 98765 43210',
              vehicle_number: result.driver.vehicle_number || 'TN-01-AB-1234'
            },
            status: 'pending',
            created_at: result.route.created_at,
            distance_km: result.route.distance_km,
            eta_minutes: result.route.eta_minutes,
            start_latitude: result.route.start_latitude,
            start_longitude: result.route.start_longitude,
            end_latitude: result.route.end_latitude,
            end_longitude: result.route.end_longitude
          };
          
          // Store route data
          const existingRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
          existingRoutes.push(routeData);
          localStorage.setItem('assignedRoutes', JSON.stringify(existingRoutes));
          
          console.log('🚚 Route data stored:', routeData);
        }
        
        // Update local blood requests status
        const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
        const updatedRequests = bloodRequests.map(req => {
          if (req.id === requestId) {
            return { ...req, status: 'approved', approved_at: new Date().toISOString() };
          }
          return req;
        });
        localStorage.setItem('bloodRequests', JSON.stringify(updatedRequests));
        
        // Refresh data
        fetchData();
        
        // Show success message with driver notification info
        alert(`✅ Blood request approved successfully!\n\n🚚 Driver notification sent!\n📱 Driver: ${result.driver_notification?.driver_name || 'Unknown'}\n🗺️ Route created: ${result.route.id}\n⏱️ ETA: ${result.route.eta_minutes} minutes\n\nThe driver will now receive a notification to start the route.`);
        
      } else {
        throw new Error(result.message || 'Approval failed');
      }
      
    } catch (error) {
      console.error('❌ Error approving blood request:', error);
      
      // Fallback to localStorage if API fails
      console.log('🔄 Falling back to localStorage approval...');
      
      // Update request status in localStorage
      const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
      const updatedRequests = bloodRequests.map(req => {
        if (req.id === requestId) {
          return { ...req, status: 'approved', approved_at: new Date().toISOString() };
        }
        return req;
      });
      localStorage.setItem('bloodRequests', JSON.stringify(updatedRequests));

      // Create a route assignment for the driver
      const approvedRequest = updatedRequests.find(req => req.id === requestId);
      const routeData = {
        id: generateUniqueId(),
        request_id: requestId,
        blood_type: approvedRequest.blood_type,
        quantity_ml: approvedRequest.quantity_ml,
        source: {
          name: approvedRequest.blood_bank_name,
          address: 'Chennai Central Blood Bank, Anna Salai, Chennai',
          latitude: 13.0827,
          longitude: 80.2707
        },
        destination: {
          name: approvedRequest.hospital_name,
          address: 'Hospital Address, Chennai',
          latitude: 13.0569,
          longitude: 80.2425
        },
        driver: {
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          vehicle_number: 'TN-01-AB-1234'
        },
        status: 'assigned',
        created_at: new Date().toISOString(),
        distance_km: approvedRequest.distance_km || 15,
        estimated_time: approvedRequest.estimated_time || 25,
        eta_minutes: approvedRequest.estimated_time || 25,
        start_latitude: 13.0827,
        start_longitude: 80.2707,
        end_latitude: 13.0569,
        end_longitude: 80.2425
      };

      // Store route data
      const existingRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
      existingRoutes.push(routeData);
      localStorage.setItem('assignedRoutes', JSON.stringify(existingRoutes));

      // Refresh data
      fetchData();
      
      alert(`⚠️ API failed, using fallback approval.\n\nBlood request approved! Route assigned to driver. Route ID: ${routeData.id}`);
    }
  };

  const handleRejectBloodRequest = async (requestId) => {
    try {
      // Update request status in localStorage
      const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
      const updatedRequests = bloodRequests.map(req => {
        if (req.id === requestId) {
          return { ...req, status: 'rejected', rejected_at: new Date().toISOString() };
        }
        return req;
      });
      localStorage.setItem('bloodRequests', JSON.stringify(updatedRequests));

      // Refresh data
      fetchData();
      
      alert('Blood request rejected.');
      
    } catch (error) {
      console.error('Error rejecting blood request:', error);
      alert('Error rejecting blood request');
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

  // Note: We're using pendingBloodRequests state instead of filtering here
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
                <h3 className="text-sm font-medium text-green-800">Blood Delivery Started!</h3>
                <p className="text-sm text-green-700 mt-1">
                  {routeNotifications[routeNotifications.length - 1]?.message || 'Driver has started the route'}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Redirecting to live tracking in 3 seconds...
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

        {/* Live Tracking Access */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Live Blood Delivery Tracking</span>
              </CardTitle>
              <CardDescription>
                Monitor active blood delivery routes in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBloodRequests.filter(req => req.status === 'approved').length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-3">
                    Active blood delivery routes from your blood bank:
                  </div>
                  {pendingBloodRequests
                    .filter(req => req.status === 'approved')
                    .map((request, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {request.blood_type}
                              </Badge>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {request.quantity_ml}ml
                              </Badge>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                {request.urgency}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              To: {request.hospital_name}
                            </p>
                            <p className="text-xs text-gray-600">
                              Request ID: {request.id}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Button 
                              onClick={() => window.location.href = '/tracking'}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Track Live
                            </Button>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Route Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {pendingBloodRequests.filter(req => req.status === 'created').length > 0 
                      ? 'No active routes yet. Approve requests to start tracking.'
                      : 'No pending or active blood requests at the moment.'
                    }
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/tracking'}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={pendingBloodRequests.filter(req => req.status === 'approved').length === 0}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View Live Tracking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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

        {/* Pending Blood Requests from Hospitals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-red-600" />
                <span>Pending Blood Requests ({pendingBloodRequests.length})</span>
              </div>
              <div className="flex space-x-2">
                              <Button 
                onClick={() => {
                  console.log('🔄 Manual refresh of blood requests clicked');
                  console.log('🔄 Current user state:', user);
                  console.log('🔄 Current entityDetails state:', entityDetails);
                  
                  const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
                  console.log('🔄 Current blood requests:', bloodRequests);
                  console.log('🔄 Current localStorage keys:', Object.keys(localStorage));
                  
                  // Check each blood request status
                  bloodRequests.forEach((req, index) => {
                    console.log(`🔄 Blood request ${index}:`, {
                      id: req.id,
                      status: req.status,
                      blood_type: req.blood_type,
                      quantity_ml: req.quantity_ml
                    });
                  });
                  
                  const pendingRequests = bloodRequests.filter(req => req.status === 'pending_approval');
                  console.log('🔄 Pending requests after refresh:', pendingRequests);
                  setPendingBloodRequests(pendingRequests);
                }}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
                <Button 
                  onClick={() => {
                    // Add a test request for debugging
                    const testRequest = {
                      id: 'test-' + Date.now(),
                      blood_type: 'O+',
                      quantity_ml: 450,
                      urgency: 'critical',
                      hospital_name: 'Test Hospital',
                      status: 'pending_approval',
                      created_at: new Date().toISOString(),
                      distance_km: 15,
                      estimated_time: '30 min'
                    };
                    const existingRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
                    existingRequests.push(testRequest);
                    localStorage.setItem('bloodRequests', JSON.stringify(existingRequests));
                    console.log('🧪 Test request added:', testRequest);
                    console.log('🧪 All blood requests after adding test:', existingRequests);
                    fetchData(); // Refresh the data
                  }}
                  size="sm"
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  🧪 Add Test
                </Button>
                <Button 
                  onClick={() => {
                    // Check and fix blood request statuses
                    console.log('🔧 Checking blood request statuses...');
                    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
                    
                    bloodRequests.forEach((req, index) => {
                      console.log(`🔧 Request ${index}:`, {
                        id: req.id,
                        status: req.status,
                        blood_type: req.blood_type
                      });
                      
                      // If status is missing or not 'pending_approval', fix it
                      if (!req.status || req.status !== 'pending_approval') {
                        console.log(`🔧 Fixing request ${index} status from '${req.status}' to 'pending_approval'`);
                        req.status = 'pending_approval';
                      }
                    });
                    
                    localStorage.setItem('bloodRequests', JSON.stringify(bloodRequests));
                    console.log('🔧 Fixed blood requests:', bloodRequests);
                    fetchData(); // Refresh the data
                  }}
                  size="sm"
                  variant="outline"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  🔧 Fix Statuses
                </Button>
                <Button 
                  onClick={() => {
                    // Show all blood requests regardless of status
                    console.log('👁️ Showing all blood requests...');
                    const bloodRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
                    
                    console.log('👁️ All blood requests in localStorage:');
                    bloodRequests.forEach((req, index) => {
                      console.log(`👁️ Request ${index + 1}:`, {
                        id: req.id,
                        status: req.status || 'NO_STATUS',
                        blood_type: req.blood_type,
                        hospital: req.hospital_name,
                        quantity: req.quantity_ml,
                        created: req.created_at
                      });
                    });
                    
                    // Also show what's in the pendingBloodRequests state
                    console.log('👁️ Current pendingBloodRequests state:', pendingBloodRequests);
                    
                    // Show localStorage keys
                    console.log('👁️ All localStorage keys:', Object.keys(localStorage));
                    
                    // Show routeNotifications
                    const notifications = JSON.parse(localStorage.getItem('routeNotifications') || '[]');
                    console.log('👁️ All routeNotifications in localStorage:', notifications);
                  }}
                  size="sm"
                  variant="outline"
                  className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                  👁️ Show All
                </Button>
              </div>
            </div>
            <CardDescription>
              Blood requests from hospitals awaiting your approval
            </CardDescription>
            {/* Debug Info - Remove this in production */}
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <p className="font-medium">Debug Info:</p>
              <p>Total requests in localStorage: {JSON.parse(localStorage.getItem('bloodRequests') || '[]').length}</p>
              <p>Pending requests: {pendingBloodRequests.length}</p>
              <p>User role: {user?.role || 'undefined'}</p>
              <p>Entity name: {entityDetails?.name || 'null'}</p>
              <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
              <div className="flex space-x-2 mt-2">
                <Button 
                  onClick={() => {
                    console.log('🧪 Force refresh clicked');
                    fetchData();
                  }}
                  size="sm"
                  variant="outline"
                >
                  🧪 Force Refresh
                </Button>
                <Button 
                  onClick={async () => {
                    console.log('🧪 Testing API endpoint...');
                    try {
                      const response = await fetch('/api/demo/emergency_requests');
                      console.log('🧪 Test API response:', response.status, response.statusText);
                      if (response.ok) {
                        const data = await response.json();
                        console.log('🧪 Test API data length:', data.length);
                      }
                    } catch (error) {
                      console.error('🧪 Test API error:', error);
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  🧪 Test API
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pendingBloodRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending blood requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBloodRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-red-50">
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
                        <p className="text-sm text-gray-600">{request.hospital?.name || request.hospital_name || 'Unknown Hospital'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Distance</p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {request.distance_km || 'N/A'} km
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Estimated Time</p>
                        <p className="text-sm text-green-600 font-semibold">
                          {request.predicted_eta_minutes ? `${request.predicted_eta_minutes} minutes` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApproveBloodRequest(request.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleRejectBloodRequest(request.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
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
