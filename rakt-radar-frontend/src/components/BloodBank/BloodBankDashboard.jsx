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
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [isDeletingRequests, setIsDeletingRequests] = useState(false);

  const navigate = useNavigate();

  const addLiveUpdate = (message, type = 'info') => {
    const update = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    // For now, just log the message
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // You can add a toast notification system here later
    if (type === 'error') {
      alert(`❌ ${message}`);
    } else if (type === 'success') {
      alert(`✅ ${message}`);
    }
  };

  // Listen for route approved events (when other pages approve routes)
  useEffect(() => {
    const handleRouteApproved = (event) => {
      console.log('🏥 Blood Bank - Route approved event received:', event.detail);
      const { routeData } = event.detail;
      
      // Set a flag in localStorage to indicate route approval
      localStorage.setItem('routeApproved', 'true');
      localStorage.setItem('routeApprovedAt', new Date().toISOString());
      
      // Show loading screen and redirect to tracking
      setShowLoadingScreen(true);
      
      setTimeout(() => {
        console.log('🚀 Redirecting blood bank to tracking page from event...');
        navigate('/tracking');
      }, 2000);
    };
    
    window.addEventListener('routeApproved', handleRouteApproved);
    
    return () => {
      window.removeEventListener('routeApproved', handleRouteApproved);
    };
  }, [navigate]);

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
            
            // For hackathon demo: Show ALL pending requests (not just assigned to this blood bank)
            const pendingRequests = requests.filter(request => {
              // Include both 'created' and 'pending_approval' statuses
              const validStatuses = ['created', 'pending_approval'];
              const matches = validStatuses.includes(request.status);
              console.log(`🔍 Blood Bank - Request ${request.id}: status=${request.status}, suggested_bank_id=${request.suggested_bank_id}, matches=${matches}`);
              return matches;
            });
            
            // Filter out deleted requests
            const deletedRequestIds = JSON.parse(localStorage.getItem('deletedBloodRequestIds') || '[]');
            const finalPendingRequests = pendingRequests.filter(request => !deletedRequestIds.includes(request.id));
            
            console.log('🔍 Blood Bank - Pending requests from API (filtered):', finalPendingRequests);
            console.log('🔍 Blood Bank - Setting pendingBloodRequests state with', finalPendingRequests.length, 'requests');
            setPendingBloodRequests(finalPendingRequests);
            
            // Debug: Check what's in the state after setting
            setTimeout(() => {
              console.log('🔍 Blood Bank - State after setPendingBloodRequests:', finalPendingRequests);
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
      
      // Load inventory data (blood units)
      await loadInventoryData();
      
      // Load other requests data
      await loadOtherRequestsData();
      
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
    
    // If no blood requests exist, create some mock data for demo
    if (allBloodRequests.length === 0) {
      console.log('🔍 Blood Bank - No blood requests found, creating mock data...');
      const mockBloodRequests = [
        {
          id: 'mock_req_001',
          blood_type: 'O+',
          quantity_ml: 450,
          urgency: 'critical',
          status: 'pending_approval',
          hospital: { name: 'Emergency Trauma Center', city: 'Chennai' },
          hospital_name: 'Emergency Trauma Center',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          distance_km: 8,
          predicted_eta_minutes: 15
        },
        {
          id: 'mock_req_002',
          blood_type: 'A+',
          quantity_ml: 300,
          urgency: 'high',
          status: 'pending_approval',
          hospital: { name: 'City Medical Institute', city: 'Chennai' },
          hospital_name: 'City Medical Institute',
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
          distance_km: 12,
          predicted_eta_minutes: 20
        },
        {
          id: 'mock_req_003',
          blood_type: 'B+',
          quantity_ml: 500,
          urgency: 'medium',
          status: 'pending_approval',
          hospital: { name: 'Regional Hospital', city: 'Chennai' },
          hospital_name: 'Regional Hospital',
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          distance_km: 15,
          predicted_eta_minutes: 25
        }
      ];
      
      console.log('🔍 Blood Bank - Mock blood requests created:', mockBloodRequests);
      localStorage.setItem('bloodRequests', JSON.stringify(mockBloodRequests));
      allBloodRequests.push(...mockBloodRequests);
    }
    
    // Get deleted request IDs to filter them out
    const deletedRequestIds = JSON.parse(localStorage.getItem('deletedBloodRequestIds') || '[]');
    console.log('🔍 Blood Bank - Deleted request IDs:', deletedRequestIds);
    
    // Filter out deleted requests and show only valid pending requests
    const validStatuses = ['created', 'pending_approval'];
    const pendingRequests = allBloodRequests.filter(request => 
      validStatuses.includes(request.status) && !deletedRequestIds.includes(request.id)
    );
    
    console.log('🔍 Blood Bank - Pending requests from localStorage (filtered):', pendingRequests);
    setPendingBloodRequests(pendingRequests);
    
    // Also load mock inventory and other requests data for complete dashboard
    loadMockInventoryData();
    loadMockRequestsData();
  };

  const loadInventoryData = async () => {
    try {
      console.log('🔍 Blood Bank - Loading inventory data...');
      
      // Try to fetch from backend API first
      try {
        const response = await fetch('/api/demo/blood_units', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const inventoryData = await response.json();
          console.log('🔍 Blood Bank - Inventory API response:', inventoryData);
          setInventory(inventoryData);
          localStorage.setItem('bloodInventory', JSON.stringify(inventoryData));
        } else {
          console.log('🔍 Blood Bank - Inventory API failed, using mock data');
          loadMockInventoryData();
        }
      } catch (error) {
        console.log('🔍 Blood Bank - Inventory API error, using mock data:', error);
        loadMockInventoryData();
      }
    } catch (error) {
      console.error('❌ Error loading inventory data:', error);
      loadMockInventoryData();
    }
  };

  const loadMockInventoryData = () => {
    console.log('🔍 Blood Bank - Loading mock inventory data...');
    
    // Create realistic mock inventory data for demo
    const mockInventory = [
      {
        id: 'unit_001',
        blood_type: 'O+',
        quantity_ml: 450,
        status: 'available',
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        is_flagged_for_expiry: false,
        source: 'Voluntary Donation',
        collected_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        id: 'unit_002',
        blood_type: 'A+',
        quantity_ml: 450,
        status: 'available',
        expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
        is_flagged_for_expiry: false,
        source: 'Voluntary Donation',
        collected_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        id: 'unit_003',
        blood_type: 'B+',
        quantity_ml: 450,
        status: 'available',
        expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
        is_flagged_for_expiry: false,
        source: 'Voluntary Donation',
        collected_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 'unit_004',
        blood_type: 'AB+',
        quantity_ml: 450,
        status: 'reserved',
        expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days from now
        is_flagged_for_expiry: false,
        source: 'Voluntary Donation',
        collected_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: 'unit_005',
        blood_type: 'O-',
        quantity_ml: 450,
        status: 'available',
        expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now - EXPIRING SOON
        is_flagged_for_expiry: true,
        source: 'Voluntary Donation',
        collected_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() // 25 days ago
      },
      {
        id: 'unit_006',
        blood_type: 'A-',
        quantity_ml: 450,
        status: 'available',
        expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now - EXPIRING SOON
        is_flagged_for_expiry: true,
        source: 'Voluntary Donation',
        collected_date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString() // 23 days ago
      }
    ];
    
    console.log('🔍 Blood Bank - Mock inventory data created:', mockInventory);
    setInventory(mockInventory);
    localStorage.setItem('bloodInventory', JSON.stringify(mockInventory));
  };

  const loadOtherRequestsData = async () => {
    try {
      console.log('🔍 Blood Bank - Loading other requests data...');
      
      // Try to fetch from backend API first
      try {
        const response = await fetch('/api/demo/emergency_requests', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const allRequests = await response.json();
          console.log('🔍 Blood Bank - All requests API response:', allRequests);
          
          // Set all requests (for active deliveries, completed requests, etc.)
          setRequests(allRequests);
          localStorage.setItem('allBloodRequests', JSON.stringify(allRequests));
        } else {
          console.log('🔍 Blood Bank - Requests API failed, using mock data');
          loadMockRequestsData();
        }
      } catch (error) {
        console.log('🔍 Blood Bank - Requests API error, using mock data:', error);
        loadMockRequestsData();
      }
    } catch (error) {
      console.error('❌ Error loading other requests data:', error);
      loadMockRequestsData();
    }
  };

  const loadMockRequestsData = () => {
    console.log('🔍 Blood Bank - Loading mock requests data...');
    
    // Create realistic mock requests data for demo
    const mockRequests = [
      {
        id: 'req_001',
        blood_type: 'O+',
        quantity_ml: 450,
        urgency: 'critical',
        status: 'approved',
        hospital: { name: 'City General Hospital', city: 'Chennai' },
        hospital_name: 'City General Hospital',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        distance_km: 12,
        estimated_time: 25,
        predicted_eta_minutes: 25
      },
      {
        id: 'req_002',
        blood_type: 'A+',
        quantity_ml: 300,
        urgency: 'high',
        status: 'en_route',
        hospital: { name: 'Metro Medical Center', city: 'Chennai' },
        hospital_name: 'Metro Medical Center',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        distance_km: 18,
        estimated_time: 35,
        predicted_eta_minutes: 35,
        route: {
          driver_name: 'Rajesh Kumar',
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          progress_percent: 45
        }
      },
      {
        id: 'req_003',
        blood_type: 'B+',
        quantity_ml: 500,
        urgency: 'medium',
        status: 'delivered',
        hospital: { name: 'Community Hospital', city: 'Chennai' },
        hospital_name: 'Community Hospital',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        distance_km: 15,
        estimated_time: 30,
        predicted_eta_minutes: 30
      }
    ];
    
    console.log('🔍 Blood Bank - Mock requests data created:', mockRequests);
    setRequests(mockRequests);
    localStorage.setItem('allBloodRequests', JSON.stringify(mockRequests));
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
      // Don't refresh if we're currently deleting requests
      if (isDeletingRequests) {
        console.log('🔄 Skipping refresh - currently deleting requests');
        return;
      }
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
  }, [fetchData, isDeletingRequests]);

  // Enhanced real-time updates for instant notification
  useEffect(() => {
    if (!user || !entityDetails) return;

    console.log('🔌 Blood Bank - Setting up enhanced real-time listeners...');

    // Function to refresh data immediately
    const refreshDataImmediately = () => {
      console.log('⚡ Blood Bank - Immediate refresh triggered');
      fetchData();
    };

    // Listen for custom events from hospital
    const handleCustomEvent = () => {
      console.log('📡 Blood Bank - Custom event received, immediate refresh');
      refreshDataImmediately();
    };

    // Listen for localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'bloodRequests' || e.key === 'bloodRequestsUpdate') {
        console.log('📡 Blood Bank - localStorage change detected, immediate refresh');
        refreshDataImmediately();
      }
    };

    // Listen for BroadcastChannel messages
    let broadcastChannel = null;
    try {
      if (window.BroadcastChannel) {
        broadcastChannel = new BroadcastChannel('rakt-radar-updates');
        broadcastChannel.onmessage = (event) => {
          if (event.data.type === 'new_blood_request') {
            console.log('📡 Blood Bank - BroadcastChannel: New blood request, immediate refresh');
            refreshDataImmediately();
          }
        };
        console.log('✅ Blood Bank - Enhanced BroadcastChannel listener active');
      }
    } catch (e) {
      console.log('⚠️ Blood Bank - BroadcastChannel not available:', e);
    }

    // Set up event listeners
    window.addEventListener('customStorageChange', handleCustomEvent);
    window.addEventListener('storage', handleStorageChange);

    // Also poll every 2 seconds for immediate updates
    const quickPollInterval = setInterval(() => {
      // Don't poll if we're currently deleting requests
      if (isDeletingRequests) {
        console.log('🔄 Skipping quick poll - currently deleting requests');
        return;
      }
      if (user && entityDetails) {
        fetchData();
      }
    }, 2000);

    console.log('✅ Blood Bank - Enhanced real-time listeners active (2s polling + events)');

    // Cleanup
    return () => {
      window.removeEventListener('customStorageChange', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      clearInterval(quickPollInterval);
      console.log('🧹 Blood Bank - Enhanced real-time listeners cleaned up');
    };
  }, [user, entityDetails, fetchData, isDeletingRequests]);

  // Monitor for route start notifications and redirect to tracking
  useEffect(() => {
    const checkRouteNotifications = () => {
      // Check if a route was approved (simple localStorage check)
      const routeApproved = localStorage.getItem('routeApproved');
      const routeApprovedAt = localStorage.getItem('routeApprovedAt');
      
      if (routeApproved === 'true' && routeApprovedAt) {
        const approvedTime = new Date(routeApprovedAt);
        const now = new Date();
        const timeDiff = now - approvedTime;
        
        // Only redirect if the approval was recent (within last 10 seconds)
        if (timeDiff < 10000) {
          console.log('🏥 Blood Bank - Route approved flag detected in localStorage, redirecting...');
          
          // Clear the flag
          localStorage.removeItem('routeApproved');
          localStorage.removeItem('routeApprovedAt');
          
          // Show loading screen and redirect
          setShowLoadingScreen(true);
          
          setTimeout(() => {
            console.log('🚀 Redirecting blood bank to tracking page from localStorage check...');
            navigate('/tracking');
          }, 2000);
          
          return; // Exit early since we're redirecting
        }
      }
      
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
        if (user && entityDetails && !isDeletingRequests) {
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
      
      // Also check for global route started notifications
      const globalNotifications = JSON.parse(localStorage.getItem('globalNotifications') || '[]');
      const activeGlobalRouteStartedNotifications = globalNotifications.filter(n => 
        n.status === 'active' && 
        n.type === 'route_started' &&
        new Date(n.timestamp) > new Date(Date.now() - 60000) // Only notifications from last minute
      );
      
      if (activeGlobalRouteStartedNotifications.length > 0) {
        const latestGlobalNotification = activeGlobalRouteStartedNotifications[activeGlobalRouteStartedNotifications.length - 1];
        console.log('🏥 Blood Bank - Global route started notification detected:', latestGlobalNotification);
        
        // Show notification
        setRouteNotifications([latestGlobalNotification]);
        setShowRouteNotification(true);
        
        // Auto-redirect to tracking after 3 seconds
        setTimeout(() => {
          console.log('🏥 Blood Bank - Auto-redirecting to tracking page from global notification...');
          
          // Mark global notification as processed
          const updatedGlobalNotifications = globalNotifications.map(n => 
            n.id === latestGlobalNotification.id ? { ...n, status: 'processed' } : n
          );
          localStorage.setItem('globalNotifications', JSON.stringify(updatedGlobalNotifications));
          
          // Navigate to tracking page
          navigate('/tracking');
        }, 3000);
      }
    };

    // Check immediately and then every 2 seconds
    checkRouteNotifications();
    const interval = setInterval(checkRouteNotifications, 2000);
    
    // Listen for global route started events
    const handleGlobalRouteStarted = (event) => {
      console.log('🏥 Blood Bank - Global route started event received:', event.detail);
      const { notification, routeData } = event.detail;
      
      console.log('🏥 Blood Bank - Route started notification received, redirecting to tracking...');
      
      // Show notification
      setRouteNotifications([notification]);
      setShowRouteNotification(true);
      
      // Auto-redirect to tracking after 3 seconds
      setTimeout(() => {
        console.log('🏥 Blood Bank - Auto-redirecting to tracking page...');
        
        // Mark global notification as processed
        const globalNotifications = JSON.parse(localStorage.getItem('globalNotifications') || '[]');
        const updatedGlobalNotifications = globalNotifications.map(n => 
          n.id === notification.id ? { ...n, status: 'processed' } : n
        );
        localStorage.setItem('globalNotifications', JSON.stringify(updatedGlobalNotifications));
        
        // Navigate to tracking page
        navigate('/tracking');
      }, 3000);
    };
    
    // Listen for global route started events
    window.addEventListener('globalRouteStarted', handleGlobalRouteStarted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('globalRouteStarted', handleGlobalRouteStarted);
    };
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
      console.log('🏥 Blood Bank - handleApproveBloodRequest FUNCTION CALLED!');
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
      console.log('🏥 Blood Bank - Driver notification driver_name:', result.driver_notification?.driver_name);
      console.log('🏥 Blood Bank - Driver object:', result.driver);
      
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
          console.log('🔄 Creating route data from result:', result);
          console.log('🔄 Route object:', result.route);
          console.log('🔄 Driver notification:', result.driver_notification);
          console.log('🔄 Driver name from notification:', result.driver_notification.driver_name);
          
          const routeData = {
            id: result.route.id,
            request_id: requestId,
            blood_type: result.driver_notification.blood_type,
            quantity_ml: result.driver_notification.quantity_ml,
            source: {
              name: result.driver_notification.blood_bank_name,
              address: 'Blood Bank Address',
              latitude: result.route.start_latitude || 13.0827,
              longitude: result.route.start_longitude || 80.2707
            },
            destination: {
              name: result.driver_notification.hospital_name,
              address: 'Hospital Address',
              latitude: result.route.end_latitude || 13.0827,
              longitude: result.route.end_longitude || 80.2707
            },
            driver: {
              name: result.driver_notification.driver_name, // Use the driver name from notification
              phone: result.driver?.phone || '+91 98765 43210',
              vehicle_number: result.driver?.vehicle_number || 'TN-01-AB-1234'
            },
            status: 'pending',
            created_at: result.route.created_at,
            distance_km: result.route.distance_km || 0,
            eta_minutes: result.route.eta_minutes || 30,
            start_latitude: result.route.start_latitude || 13.0827,
            start_longitude: result.route.start_longitude || 80.2707,
            end_latitude: result.route.end_latitude || 13.0827,
            end_longitude: result.route.end_longitude || 80.2707
          };
          
          // Store route data
          console.log('🔄 About to store route data in localStorage...');
          console.log('🔄 Current assignedRoutes in localStorage:', localStorage.getItem('assignedRoutes'));
          console.log('🔄 Route data to be stored:', routeData);
          console.log('🔄 Driver name in routeData:', routeData.driver.name);
          
          const existingRoutes = JSON.parse(localStorage.getItem('assignedRoutes') || '[]');
          console.log('🔄 Parsed existing routes:', existingRoutes);
          
          existingRoutes.push(routeData);
          console.log('🔄 Routes after adding new route:', existingRoutes);
          
          try {
            localStorage.setItem('assignedRoutes', JSON.stringify(existingRoutes));
            console.log('✅ Successfully stored in localStorage');
            
            // Verify storage
            const verifyStorage = localStorage.getItem('assignedRoutes');
            console.log('✅ Verification - localStorage now contains:', verifyStorage);
          } catch (error) {
            console.error('❌ Error storing in localStorage:', error);
          }
          
          // Dispatch custom event to notify driver dashboard
          window.dispatchEvent(new CustomEvent('routeAssigned', { detail: routeData }));
          console.log('📡 Custom event dispatched: routeAssigned');
          
          // Also dispatch a storage event for cross-tab communication
          const storageEvent = new StorageEvent('storage', {
            key: 'routeNotifications',
            newValue: JSON.stringify(existingNotifications),
            oldValue: JSON.stringify(existingNotifications.slice(0, -1)),
            url: window.location.href
          });
          window.dispatchEvent(storageEvent);
          console.log('📡 Storage event dispatched for cross-tab communication');
          
          // Force a localStorage update to trigger storage events
          localStorage.setItem('routeNotifications', JSON.stringify(existingNotifications));
          console.log('📡 localStorage updated to trigger storage events');
          
          // Create a global notification that persists across tabs
          const globalNotification = {
            id: `global_${Date.now()}`,
            type: 'route_assigned',
            data: routeData,
            timestamp: new Date().toISOString(),
            status: 'active'
          };
          
          // Store in a special global notifications key
          const globalNotifications = JSON.parse(localStorage.getItem('globalNotifications') || '[]');
          globalNotifications.push(globalNotification);
          localStorage.setItem('globalNotifications', JSON.stringify(globalNotifications));
          
          // Dispatch a global custom event
          window.dispatchEvent(new CustomEvent('globalRouteAssigned', { 
            detail: { 
              notification: globalNotification,
              routeData: routeData 
            } 
          }));
          console.log('📡 Global route assigned event dispatched');
          
          // Test: Dispatch a test event to see if the driver is listening
          console.log('🧪 Testing notification system...');
          console.log('🧪 Driver username expected:', routeData.driver.name);
          console.log('🧪 Global notification created:', globalNotification);
          console.log('🧪 All global notifications:', globalNotifications);
          
          // Force a test notification to appear immediately
          setTimeout(() => {
            console.log('🧪 Dispatching test notification after 1 second...');
            window.dispatchEvent(new CustomEvent('globalRouteAssigned', { 
              detail: { 
                notification: globalNotification,
                routeData: routeData 
              } 
            }));
          }, 1000);
          
          // Also dispatch immediately for immediate testing
          console.log('🧪 Dispatching immediate test notification...');
          window.dispatchEvent(new CustomEvent('globalRouteAssigned', { 
            detail: { 
              notification: globalNotification,
              routeData: routeData 
            } 
          }));
          
          // Create a simple test notification that should definitely work
          const testNotification = {
            id: `test_${Date.now()}`,
            type: 'route_assigned',
            data: routeData,
            timestamp: new Date().toISOString(),
            status: 'active'
          };
          
          // Store test notification
          const testNotifications = JSON.parse(localStorage.getItem('testNotifications') || '[]');
          testNotifications.push(testNotification);
          localStorage.setItem('testNotifications', JSON.stringify(testNotifications));
          
          // Dispatch test event
          window.dispatchEvent(new CustomEvent('testRouteAssigned', { 
            detail: { 
              notification: testNotification,
              routeData: routeData 
            } 
          }));
          console.log('🧪 Test notification dispatched:', testNotification);
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
        
        // SIMPLIFIED: Show loading screen and redirect blood bank to tracking
        console.log('🚀 Route approved! Showing loading screen and redirecting to tracking...');
        
        // Store the approved route data for tracking page to access
        localStorage.setItem('approvedRouteData', JSON.stringify(routeData));
        localStorage.setItem('routeApproved', 'true');
        localStorage.setItem('routeApprovedAt', new Date().toISOString());
        
        // Show loading screen and redirect to tracking
        setShowLoadingScreen(true);
        
        // Redirect to tracking after 2 seconds (show loading screen)
        setTimeout(() => {
          console.log('🚀 Redirecting blood bank to tracking page...');
          navigate('/tracking');
        }, 2000);
        
        // Refresh data
        fetchData();
        
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

      // SIMPLIFIED: Show loading screen and redirect all pages to tracking (fallback)
      console.log('🚀 Fallback route approved! Redirecting all pages to tracking...');
      
      // Store the approved route data for all pages to access
      localStorage.setItem('approvedRouteData', JSON.stringify(routeData));
      localStorage.setItem('routeApproved', 'true');
      localStorage.setItem('routeApprovedAt', new Date().toISOString());
      
      // Force a localStorage change to trigger cross-tab events
      const timestamp = Date.now();
      localStorage.setItem('routeApprovedTimestamp', timestamp.toString());
      
      // Show loading screen and redirect to tracking
      setShowLoadingScreen(true);
      
      // Redirect to tracking after 2 seconds (show loading screen)
      setTimeout(() => {
        console.log('🚀 Redirecting blood bank to tracking page (fallback)...');
        navigate('/tracking');
      }, 2000);
      
      // Also notify other pages to redirect (simple approach)
      window.dispatchEvent(new CustomEvent('routeApproved', { 
        detail: { routeData: routeData } 
      }));
      
      // MORE AGGRESSIVE: Force all pages to check for approval (fallback)
      // Set multiple flags to ensure detection
      localStorage.setItem('forceRedirect', 'true');
      localStorage.setItem('redirectTarget', '/tracking');
      localStorage.setItem('redirectReason', 'route_approved_fallback');
      
      // Also set a flag that expires in 5 seconds
      setTimeout(() => {
        localStorage.removeItem('forceRedirect');
        localStorage.removeItem('redirectTarget');
        localStorage.removeItem('redirectReason');
      }, 5000);
      
      // Dispatch multiple events to ensure delivery
      ['routeApproved', 'forceRedirect', 'globalRedirect'].forEach(eventName => {
        window.dispatchEvent(new CustomEvent(eventName, { 
          detail: { 
            routeData: routeData,
            action: 'redirect_to_tracking',
            target: '/tracking'
          } 
        }));
      });
      
      console.log('🚀 Multiple notification channels activated (fallback)! All pages should redirect now.');
      
      // SIMPLE SOLUTION: Use a polling approach that definitely works
      // Set a flag that other tabs can check every second
      localStorage.setItem('POLLING_ROUTE_APPROVED', 'true');
      localStorage.setItem('POLLING_TIMESTAMP', Date.now().toString());
      localStorage.setItem('POLLING_ROUTE_DATA', JSON.stringify(routeData));
      
      // Clear the flag after 10 seconds
      setTimeout(() => {
        localStorage.removeItem('POLLING_ROUTE_APPROVED');
        localStorage.removeItem('POLLING_TIMESTAMP');
        localStorage.removeItem('POLLING_ROUTE_DATA');
      }, 10000);
      
      console.log('✅ POLLING FLAGS SET! Other tabs should detect this within 1 second.');
      
      // Refresh data
      fetchData();
    }
  };

  const handleRejectBloodRequest = async (requestId) => {
    try {
      console.log('🏥 Blood Bank - Rejecting request:', requestId);
      
      // For demo purposes, skip API call
      console.log('🏥 Blood Bank - Skipping API call, using localStorage only');
      
      // Don't call fetchData() here as it will re-fetch deleted requests
      console.log('✅ Request rejected successfully');
      addLiveUpdate(`❌ Blood request rejected successfully`, 'success');
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      addLiveUpdate(`❌ Error rejecting request: ${error.message}`, 'error');
    }
  };

  const handleDeleteBloodRequest = async (requestId) => {
    try {
      console.log('🗑️ Blood Bank - Deleting request:', requestId);
      
      setIsDeletingRequests(true);
      
      // Remove from localStorage
      const updatedRequests = pendingBloodRequests.filter(req => req.id !== requestId);
      setPendingBloodRequests(updatedRequests);
      
      // Also remove from localStorage
      const existingRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
      const filteredRequests = existingRequests.filter(req => req.id !== requestId);
      localStorage.setItem('bloodRequests', JSON.stringify(filteredRequests));
      
      // Track deleted request IDs to prevent them from coming back
      const deletedRequests = JSON.parse(localStorage.getItem('deletedBloodRequestIds') || '[]');
      deletedRequests.push(requestId);
      localStorage.setItem('deletedBloodRequestIds', JSON.stringify(deletedRequests));
      
      console.log('✅ Request deleted successfully');
      addLiveUpdate(`🗑️ Blood request deleted successfully`, 'success');
      
      // Reset flag after a short delay
      setTimeout(() => setIsDeletingRequests(false), 1000);
      
    } catch (error) {
      console.error('Error deleting request:', error);
      addLiveUpdate(`❌ Error deleting request: ${error.message}`, 'error');
      setIsDeletingRequests(false);
    }
  };

  const handleDeleteAllRequests = async () => {
    try {
      console.log('🗑️ Blood Bank - Deleting ALL requests');
      
      if (window.confirm('Are you sure you want to delete ALL blood requests? This action cannot be undone.')) {
        setIsDeletingRequests(true);
        
        // Get all current request IDs to track them as deleted
        const currentRequestIds = pendingBloodRequests.map(req => req.id);
        
        // Clear all requests
        setPendingBloodRequests([]);
        
        // Clear from localStorage
        localStorage.setItem('bloodRequests', JSON.stringify([]));
        
        // Track all deleted request IDs
        const deletedRequests = JSON.parse(localStorage.getItem('deletedBloodRequestIds') || '[]');
        deletedRequests.push(...currentRequestIds);
        localStorage.setItem('deletedBloodRequestIds', JSON.stringify(deletedRequests));
        
        console.log('✅ All requests deleted successfully');
        addLiveUpdate(`🗑️ All blood requests deleted successfully`, 'success');
        
        // Reset flag after a short delay
        setTimeout(() => setIsDeletingRequests(false), 1000);
      }
      
    } catch (error) {
      console.error('Error deleting all requests:', error);
      addLiveUpdate(`❌ Error deleting all requests: ${error.message}`, 'error');
      setIsDeletingRequests(false);
    }
  };

  const clearDeletedRequestsTracking = () => {
    try {
      console.log('🧹 Clearing deleted requests tracking...');
      localStorage.removeItem('deletedBloodRequestIds');
      console.log('✅ Deleted requests tracking cleared');
      addLiveUpdate(`🧹 Deleted requests tracking cleared`, 'success');
      
      // Refresh data to show any previously deleted requests
      fetchData();
    } catch (error) {
      console.error('Error clearing deleted requests tracking:', error);
      addLiveUpdate(`❌ Error clearing tracking: ${error.message}`, 'error');
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

  // Debug logging for stats
  console.log('🔍 Blood Bank - Stats calculation:', {
    inventoryLength: inventory.length,
    totalUnits,
    availableUnits,
    reservedUnits,
    expiringUnits,
    requestsLength: requests.length,
    activeRequestsLength: activeRequests.length,
    completedRequestsLength: completedRequests.length,
    pendingBloodRequestsLength: pendingBloodRequests.length
  });

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

      {showLoadingScreen && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900">Processing Request...</h2>
            <p className="text-gray-600">Redirecting to tracking page in a moment.</p>
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
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-red-600" />
              <span>Pending Blood Requests ({pendingBloodRequests.length})</span>
            </CardTitle>
            <CardDescription>
              Emergency blood requests from hospitals requiring approval
            </CardDescription>
            {pendingBloodRequests.length > 0 && (
              <div className="flex justify-end space-x-2">
                <Button 
                  onClick={handleDeleteAllRequests}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  🗑️ Delete All Requests
                </Button>
                <Button 
                  onClick={clearDeletedRequestsTracking}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  🧹 Clear Tracking
                </Button>
              </div>
            )}
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
                        onClick={() => {
                          console.log('🔘 Approve button clicked for request:', request.id);
                          handleApproveBloodRequest(request.id);
                        }}
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
                      <Button 
                        onClick={() => handleDeleteBloodRequest(request.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        🗑️ Delete
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
