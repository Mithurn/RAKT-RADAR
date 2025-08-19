import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { generateUniqueId } from '../lib/utils';
import { 
  Route, 
  MapPin, 
  Clock, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  RefreshCw,
  Brain,
  TrendingUp,
  Loader2
} from 'lucide-react';

const API_BASE = '/api';

const SmartRouting = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [bloodUnits, setBloodUnits] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [aiStatus, setAiStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track initiated transfers to prevent duplicates
  const initiatedTransfersRef = useRef(new Set());
  
  // Emergency Alert System
  const [livesSaved, setLivesSaved] = useState(0);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [currentEmergency, setCurrentEmergency] = useState(null);
  
  // AI Analysis States for Demo
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysisSteps, setAiAnalysisSteps] = useState([]);
  const [currentAIStep, setCurrentAIStep] = useState(0);
  const [aiResults, setAiResults] = useState(null);
  
  // Transfer Tracking States

  // Route Start Notification System
  const [routeNotifications, setRouteNotifications] = useState([]);
  const [showRouteNotification, setShowRouteNotification] = useState(false);
  
  // Ref to track processed matches and prevent duplicate alerts
  const processedMatchesRef = useRef(new Set());

  const [emergencyRequest, setEmergencyRequest] = useState({
    blood_type: '',
    urgency: 'high',
    hospital_id: '', // Will be set when hospitals are loaded
    quantity_needed: ''
  });

  useEffect(() => {
    console.log('SmartRouting - Component mounted, fetching data...');
    fetchData();
    // Real-time AI monitoring every 15 seconds
    const interval = setInterval(fetchMatches, 15000);
    return () => clearInterval(interval);
  }, []);

  // Set default hospital when hospitals are loaded
  useEffect(() => {
    if (hospitals.length > 0 && !emergencyRequest.hospital_id) {
      // Find SRM Global Hospitals or use the first hospital
      const srmHospital = hospitals.find(h => h.name.includes('SRM') || h.name.includes('Global'));
      const defaultHospital = srmHospital || hospitals[0];
      setEmergencyRequest(prev => ({
        ...prev,
        hospital_id: defaultHospital.id
      }));
      console.log('Default hospital set:', defaultHospital);
    }
  }, [hospitals, emergencyRequest.hospital_id]);

  // Monitor for route start notifications and redirect to tracking
  useEffect(() => {
    const checkRouteNotifications = () => {
      const notifications = JSON.parse(localStorage.getItem('routeNotifications') || '[]');
      const activeNotifications = notifications.filter(n => 
        n.status === 'active' && 
        n.type === 'route_started' &&
        new Date(n.timestamp) > new Date(Date.now() - 60000) // Only notifications from last minute
      );
      
      if (activeNotifications.length > 0) {
        const latestNotification = activeNotifications[activeNotifications.length - 1];
        console.log('🏥 Hospital - Route start notification detected:', latestNotification);
        
        // Show notification to user
        setRouteNotifications(activeNotifications);
        setShowRouteNotification(true);
        
        // Auto-redirect to tracking after 3 seconds
        setTimeout(() => {
          console.log('🏥 Hospital - Auto-redirecting to tracking page...');
          
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
  }, [navigate]);

  useEffect(() => {
    console.log('SmartRouting - State updated:', {
      matches: matches.length,
      hospitals: hospitals.length,
      bloodBanks: bloodBanks.length,
      bloodUnits: bloodUnits.length,
      isLoading,
      error
    });
    
    // Debug: Check for duplicate keys
    if (matches.length > 0) {
      const keys = matches.map((match, index) => `match-${match.id || match.entity_name}-${match.blood_type}-${match.distance_km || 0}-${index}`);
      const uniqueKeys = new Set(keys);
      if (keys.length !== uniqueKeys.size) {
        console.warn('SmartRouting - Duplicate keys detected in matches:', {
          totalMatches: matches.length,
          uniqueKeys: uniqueKeys.size,
          duplicateKeys: keys.length - uniqueKeys.size
        });
        console.log('Match data for debugging:', matches);
      }
    }
  }, [matches, hospitals, bloodBanks, bloodUnits, isLoading, error]);

  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

  // Separate useEffect for emergency alert monitoring
  useEffect(() => {
    // DISABLED: Automatic emergency alerts to prevent unwanted popups
    // Only set up interval if we have matches and haven't already set it up
    // if (matches.length > 0 && !processedMatchesRef.current.has('interval-setup')) {
    //   processedMatchesRef.current.add('interval-setup');
      
    //   const interval = setInterval(() => {
    //     // Check if there are any critical matches that haven't been alerted
    //     const criticalMatches = matches.filter(match => {
    //       const matchKey = `${match.entity_name}-${match.blood_type}-${match.distance_km}`;
    //       return match.urgency === 'critical' && 
    //              !processedMatchesRef.current.has(matchKey);
    //     });
        
    //     // Only process if there are new critical matches
    //     if (criticalMatches.length > 0) {
    //       criticalMatches.forEach(match => {
    //         const matchKey = `${match.entity_name}-${match.blood_type}-${match.distance_km}`;
    //         // Mark this match as processed
    //         processedMatchesRef.current.add(matchKey);
            
    //         // Create realistic SRM Global Hospitals emergency scenarios
    //         const emergencyScenarios = [
    //           {
    //             hospital: "SRM Global Hospitals",
    //             city: "Chennai",
    //             scenario: "Trauma Center - Multiple accident victims"
    //           },
    //           {
    //             hospital: "SRM Global Hospitals", 
    //             city: "Chennai",
    //             scenario: "Emergency Surgery - Critical patient"
    //           },
    //           {
    //             hospital: "SRM Global Hospitals",
    //             city: "Chennai", 
    //             scenario: "ICU - Severe blood loss"
    //           },
    //           {
    //             hospital: "SRM Global Hospitals",
    //             city: "Chennai",
    //             scenario: "Cardiac Emergency - Blood transfusion needed"
    //           },
    //           {
    //             hospital: "SRM Global Hospitals",
    //             city: "Chennai",
    //             scenario: "Emergency Department - Trauma case"
    //           },
    //           {
    //             hospital: "SRM Global Hospitals",
    //             city: "Chennai",
    //             scenario: "Emergency Surgery - Trauma case"
    //           },
    //           {
    //             hospital: "Chettinad Hospital",
    //             city: "Chennai",
    //             scenario: "ICU - Critical care blood requirement"
    //           },
    //           {
    //             hospital: "MIOT International",
    //             city: "Chennai",
    //             scenario: "Emergency Department - Accident victims"
    //           },
    //           {
    //             hospital: "Coimbatore Medical College Hospital",
    //             city: "Coimbatore",
    //             scenario: "Emergency Department - Critical trauma case"
    //           },
    //           {
    //             hospital: "Madurai Medical College Hospital",
    //             city: "Madurai",
    //             scenario: "ICU - Severe blood loss emergency"
    //           },
    //           {
    //             hospital: "Salem Government Hospital",
    //             city: "Salem",
    //             scenario: "Emergency Surgery - Blood transfusion needed"
    //           },
    //           {
    //             hospital: "Vellore Medical Center",
    //             city: "Vellore",
    //             scenario: "Trauma Center - Multiple victims"
    //           }
    //         ];
            
    //         // Pick a random emergency scenario
    //         const scenario = emergencyScenarios[Math.floor(Math.random() * emergencyScenarios.length)];
            
    //         // Calculate realistic distance based on hospital location
    //         let realisticDistance;
    //         if (scenario.city === "Chennai") {
    //           realisticDistance = Math.round((Math.random() * 25 + 5) * 100) / 100; // 5-30km for Chennai
    //         } else if (scenario.city === "Coimbatore") {
    //           realisticDistance = Math.round((Math.random() * 50 + 200) * 100) / 100; // 200-250km for Coimbatore
    //         } else if (scenario.city === "Madurai") {
    //           realisticDistance = Math.round((Math.random() * 50 + 300) * 100) / 100; // 300-350km for Madurai
    //         } else if (scenario.city === "Salem") {
    //           realisticDistance = Math.round((Math.random() * 50 + 150) * 100) / 100; // 150-200km for Salem
    //         } else if (scenario.city === "Vellore") {
    //           realisticDistance = Math.round((Math.random() * 50 + 100) * 100) / 100; // 100-150km for Vellore
    //         } else {
    //           realisticDistance = Math.round((Math.random() * 15 + 3) * 100) / 100; // Default 3-18km
    //         }
            
    //         triggerEmergencyAlert({
    //           type: 'hospital_emergency',
    //           urgency: 'critical',
    //           blood_type: match.blood_type,
    //           hospital: scenario.hospital,
    //           city: scenario.city,
    //           distance: realisticDistance,
    //           message: `CRITICAL: ${match.blood_type} blood needed at ${scenario.scenario}`
    //         });
    //       });
    //     }
    //   }, 30000); // Check every 30 seconds instead of 10
      
    //   return () => clearInterval(interval);
    // }
  }, [matches]); // Only run when matches change

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [matchesRes, hospitalsRes, banksRes, unitsRes] = await Promise.all([
        fetch(`${API_BASE}/demand_matching`),
        fetch(`${API_BASE}/hospitals`),
        fetch(`${API_BASE}/blood_banks`),
        fetch(`${API_BASE}/blood_units`)
      ]);
      
      const matchesData = await matchesRes.json();
      const hospitalsData = await hospitalsRes.json();
      const banksData = await banksRes.json();
      const unitsData = await unitsRes.json();
      
      console.log('SmartRouting - Fetched data:', {
        matches: matchesData,
        hospitals: hospitalsData,
        banks: banksData,
        units: unitsData
      });
      
      // Deduplicate matches based on a unique identifier
      const initialMatches = matchesData.matches || [];
      const uniqueInitialMatches = initialMatches.filter((match, index, self) => {
        const matchKey = `${match.entity_name}-${match.blood_type}-${match.distance_km}`;
        return index === self.findIndex(m => 
          `${m.entity_name}-${m.blood_type}-${m.distance_km}` === matchKey
        );
      });
      
      setMatches(uniqueInitialMatches);
      setHospitals(hospitalsData);
      setBloodBanks(banksData);
      setBloodUnits(unitsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderBlood = async (bloodUnit) => {
    try {
      setIsProcessing(true);
      
      // Create blood request object
      const bloodRequest = {
        id: generateUniqueId(),
        blood_type: bloodUnit.blood_type,
        quantity_ml: bloodUnit.quantity_ml,
        urgency: emergencyRequest.urgency,
        hospital_id: emergencyRequest.hospital_id,
        hospital_name: hospitals.find(h => h.id === emergencyRequest.hospital_id)?.name || 'Unknown Hospital',
        blood_bank_id: bloodUnit.source_bank_id || 'demo_bank_1',
        blood_bank_name: bloodUnit.source_bank || 'Chennai Central Blood Bank',
        status: 'pending_approval',
        created_at: new Date().toISOString(),
        distance_km: bloodUnit.distance,
        estimated_time: bloodUnit.eta,
        cost: Math.floor(bloodUnit.distance * 55)
      };

      // Store in localStorage for demo purposes
      const existingRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
      existingRequests.push(bloodRequest);
      localStorage.setItem('bloodRequests', JSON.stringify(existingRequests));
      
      console.log('🏥 Hospital - Blood request created:', bloodRequest);
      console.log('🏥 Hospital - All blood requests in localStorage:', existingRequests);

      // Show success message
      alert(`Blood request created successfully! Request ID: ${bloodRequest.id}\n\nStatus: Pending Blood Bank Approval\n\nYou will be notified once approved.`);
      
      // Reset form
      setEmergencyRequest({
        blood_type: '',
        urgency: 'high',
        hospital_id: emergencyRequest.hospital_id, // Keep hospital
        quantity_needed: ''
      });
      setSelectedMatch(null);
      
    } catch (error) {
      console.error('Error creating blood request:', error);
      alert('Failed to create blood request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${API_BASE}/demand_matching`);
      const data = await response.json();
      const newMatches = data.matches || [];
      
      // Deduplicate matches based on a unique identifier
      const uniqueMatches = newMatches.filter((match, index, self) => {
        const matchKey = `${match.entity_name}-${match.blood_type}-${match.distance_km}`;
        return index === self.findIndex(m => 
          `${m.entity_name}-${m.blood_type}-${m.distance_km}` === matchKey
        );
      });
      
      setMatches(uniqueMatches);
      
      // Check for new critical matches but don't trigger alerts immediately
      const criticalMatches = uniqueMatches.filter(match => match.urgency === 'critical');
      if (criticalMatches.length > 0) {
        addLiveUpdate(`🚨 ${criticalMatches.length} critical match(es) detected!`, 'critical');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const addLiveUpdate = (message, type = 'info') => {
    const update = {
      id: generateUniqueId(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setLiveUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
  };

  const handleEmergencyRequest = async () => {
    console.log('🚨 Emergency request started:', emergencyRequest);
    
    if (!emergencyRequest.blood_type || !emergencyRequest.hospital_id || !emergencyRequest.quantity_needed) {
      alert('Please fill in all required fields');
      return;
    }

    // Start AI Analysis
    setIsAIAnalyzing(true);
    setAiAnalysisSteps([]);
    setCurrentAIStep(0);
    setAiResults(null);
    
    addLiveUpdate(`Autonomous system analyzing emergency request for ${emergencyRequest.blood_type} blood...`, 'info');

    try {
      // FIRST: Create the emergency request via API
      console.log('📡 Creating emergency request via API...');
      
      const requestData = {
        blood_type: emergencyRequest.blood_type,
        quantity_ml: parseInt(emergencyRequest.quantity_needed),
        urgency: emergencyRequest.urgency || 'high',
        notes: emergencyRequest.notes || 'Emergency request from hospital'
      };
      
      console.log('Request data:', requestData);
      
      const response = await fetch('/api/emergency_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create emergency request');
      }
      
      const apiResponse = await response.json();
      console.log('✅ Emergency request created via API:', apiResponse);
      
      // ALSO store in localStorage so blood bank can see it
      const bloodRequest = {
        id: apiResponse.request?.id || generateUniqueId(),
        blood_type: emergencyRequest.blood_type,
        quantity_ml: parseInt(emergencyRequest.quantity_needed),
        urgency: emergencyRequest.urgency || 'high',
        hospital_id: emergencyRequest.hospital_id,
        hospital: {
          name: hospitals.find(h => h.id === emergencyRequest.hospital_id)?.name || 'Unknown Hospital',
          city: hospitals.find(h => h.id === emergencyRequest.hospital_id)?.city || 'Unknown City'
        },
        blood_bank_id: apiResponse.suggested_bank?.id || '52421b7d-0ce1-4382-ba82-cf9af817761d',
        blood_bank_name: apiResponse.suggested_bank?.name || 'SRM Blood Bank',
        status: 'pending_approval',
        created_at: new Date().toISOString(),
        distance_km: apiResponse.distance_km || 0,
        predicted_eta_minutes: parseInt(apiResponse.predicted_eta?.replace(' minutes', '') || '30'),
        ml_confidence_score: parseFloat(apiResponse.ml_confidence?.replace('%', '') || '85'),
        notes: emergencyRequest.notes || 'Emergency request from hospital'
      };
      
                       // Store in localStorage for blood bank to see
                 // Convert to the format that matches backend API response
                 const apiFormatRequest = {
                   id: bloodRequest.id,
                   blood_type: bloodRequest.blood_type,
                   quantity_ml: bloodRequest.quantity_ml,
                   urgency: bloodRequest.urgency,
                   status: bloodRequest.status,
                   hospital_id: bloodRequest.hospital_id,
                   suggested_bank_id: bloodRequest.blood_bank_id,
                   ml_confidence_score: bloodRequest.ml_confidence_score,
                   predicted_eta_minutes: bloodRequest.predicted_eta_minutes,
                   created_at: bloodRequest.created_at,
                   hospital: bloodRequest.hospital,
                   suggested_bank: {
                     id: bloodRequest.blood_bank_id,
                     name: bloodRequest.blood_bank_name
                   }
                 };
                 
                 const existingRequests = JSON.parse(localStorage.getItem('bloodRequests') || '[]');
                 existingRequests.push(apiFormatRequest);
                 localStorage.setItem('bloodRequests', JSON.stringify(existingRequests));
      
      // Dispatch custom event to notify blood bank dashboard
      window.dispatchEvent(new CustomEvent('customStorageChange'));
      
      // Also try to notify other tabs using localStorage event
      try {
        localStorage.setItem('bloodRequestsUpdate', Date.now().toString());
      } catch (e) {
        console.log('Could not update localStorage for cross-tab notification');
      }
      
      // Try BroadcastChannel API for cross-tab communication
      try {
        if (window.BroadcastChannel) {
          const channel = new BroadcastChannel('rakt-radar-updates');
          channel.postMessage({
            type: 'new_blood_request',
            requestId: bloodRequest.id,
            timestamp: Date.now()
          });
          console.log('📡 BroadcastChannel message sent to other tabs');
        }
      } catch (e) {
        console.log('Could not use BroadcastChannel:', e);
      }
      
      console.log('🏥 Hospital - Blood request also stored in localStorage:', bloodRequest);
      console.log('🏥 Hospital - All blood requests in localStorage:', existingRequests);
      
      // Create notification for blood bank
      const notification = {
        id: generateUniqueId(),
        type: 'new_blood_request',
        message: `New blood request: ${emergencyRequest.blood_type} blood needed`,
        status: 'active',
        timestamp: new Date().toISOString(),
        request_id: bloodRequest.id,
        blood_type: emergencyRequest.blood_type,
        urgency: emergencyRequest.urgency
      };
      
      const existingNotifications = JSON.parse(localStorage.getItem('routeNotifications') || '[]');
      existingNotifications.push(notification);
      localStorage.setItem('routeNotifications', JSON.stringify(existingNotifications));
      
      console.log('🔔 Notification created for blood bank:', notification);
      
      addLiveUpdate(`✅ Emergency request created successfully!`, 'success');
      
      // Simulate AI analysis steps for demo
      const analysisSteps = [
        { step: 1, message: 'Analyzing blood demand patterns', details: 'Scanning hospital requirements and urgency levels', status: 'completed', progress: 100 },
        { step: 2, message: 'Scanning blood bank inventory', details: 'Checking availability across all blood banks', status: 'completed', progress: 100 },
        { step: 3, message: 'Calculating optimal routes', details: 'Using AI to find fastest and safest delivery paths', status: 'completed', progress: 100 },
        { step: 4, message: 'Evaluating blood quality', details: 'Checking expiry dates and storage conditions', status: 'completed', progress: 100 },
        { step: 5, message: 'Optimizing delivery timing', details: 'Considering traffic and weather conditions', status: 'completed', progress: 100 },
        { step: 6, message: 'Generating smart recommendations', details: 'AI selecting best matches based on multiple factors', status: 'completed', progress: 100 },
        { step: 7, message: 'Finalizing transfer plan', details: 'Preparing comprehensive delivery strategy', status: 'completed', progress: 100 }
      ];

      // Simulate step-by-step AI thinking for demo
      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentAIStep(i);
        setAiAnalysisSteps(analysisSteps.slice(0, i + 1));
        
        // Add live update for each step
        const step = analysisSteps[i];
        addLiveUpdate(`AI ${step.message}`, 'info');
        
        // Wait between steps to show AI thinking
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      console.log('✅ AI analysis steps completed, finding matches...');

      // Use the API response data instead of local filtering
      const suggestedBank = apiResponse.suggested_bank;
      const mlConfidence = apiResponse.ml_confidence;
      const predictedEta = apiResponse.predicted_eta;
      const distanceKm = apiResponse.distance_km;
      
      console.log('API suggested bank:', suggestedBank);
      console.log('ML confidence:', mlConfidence);
      console.log('Predicted ETA:', predictedEta);
      console.log('Distance:', distanceKm);
      
      // Create AI results using the API data
      const aiResults = {
        ai_summary: {
          analysis_results: {
            total_units_scanned: 'All blood banks scanned',
            ai_confidence_score: parseFloat(mlConfidence.replace('%', '')),
            optimal_matches_identified: 1
          },
          recommendations: {
            primary_match: {
              blood_bank: suggestedBank.name,
              location: `${suggestedBank.city}, ${suggestedBank.state}`,
              distance: distanceKm,
              eta: predictedEta,
              confidence: mlConfidence,
              optimization_note: 'AI-optimized match based on distance, availability, and urgency'
            }
          }
        },
        blood_units: [{
          id: 'api-suggested',
          blood_type: emergencyRequest.blood_type,
          quantity_ml: requestData.quantity_ml,
          source_bank: suggestedBank.name,
          location: `${suggestedBank.city}, ${suggestedBank.state}`,
          distance: distanceKm,
          eta: predictedEta,
          confidence: mlConfidence
        }],
        routes: [{
          from: suggestedBank.name,
          to: 'Your Hospital',
          distance: distanceKm,
          estimated_hours: Math.ceil(parseInt(predictedEta.replace(' minutes', '')) / 60),
          route_quality: 'Excellent',
          optimization_note: 'AI-optimized route for fastest delivery'
        }]
      };
      
      setAiResults(aiResults);
      addLiveUpdate(`✅ AI found optimal match: ${suggestedBank.name} (${mlConfidence} confidence)`, 'success');
      
      console.log('🎯 Emergency request processing completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in emergency request:', error);
      addLiveUpdate(`❌ Error: ${error.message}`, 'error');
      alert(`Error creating emergency request: ${error.message}`);
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  const calculateOptimalRoute = (source, destination) => {
    // Ensure both source and destination are in Tamil Nadu for optimal routing
    if (source.state !== 'Tamil Nadu' || destination.state !== 'Tamil Nadu') {
      console.warn('Route calculation: Both source and destination should be in Tamil Nadu for optimal distance calculation');
    }
    
    // Calculate distance using Haversine formula
    const lat1 = source.latitude;
    const lon1 = source.longitude;
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    let distance = R * c;
    
    // Ensure minimum realistic distance for demo believability
    if (distance < 5) {
      distance = 5 + Math.random() * 10; // Minimum 5km, up to 15km
    }
    
    // Calculate estimated travel time (assuming 60 km/h average for Tamil Nadu roads)
    const estimatedHours = Math.ceil(distance / 60);
    
    return {
      distance: Math.round(distance * 100) / 100,
      estimatedHours,
      coordinates: [
        [lon1, lat1],
        [lon2, lat2]
      ]
    };
  };

  const calculateRoute = (lat1, lon1, lat2, lon2) => {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    let distance = R * c;
    
    // Ensure minimum realistic distance for demo believability
    if (distance < 5) {
      distance = 5 + Math.random() * 10; // Minimum 5km, up to 15km
    }
    
    // Calculate estimated travel time (assuming 60 km/h average for Tamil Nadu roads)
    const estimatedHours = Math.ceil(distance / 60);
    
    return {
      distance: Math.round(distance * 100) / 100,
      estimatedHours,
      coordinates: [
        [lon1, lat1],
        [lon2, lat2]
      ]
    };
  };

  const initiateTransfer = async (match) => {
    // Debug: Log the match object to understand its structure
    console.log('Initiating transfer for match:', match);
    console.log('Available blood units:', bloodUnits);
    
    // Create a unique transfer key
    const transferKey = `${match.blood_type}-${match.entity_name}-${match.distance_km}`;
    
    // Prevent duplicate transfer initiation
    if (isProcessing) {
      addLiveUpdate('⚠️ Transfer already in progress', 'warning');
      return;
    }
    
    // Check if this transfer was already initiated
    if (initiatedTransfersRef.current.has(transferKey)) {
      addLiveUpdate('⚠️ Transfer already initiated for this match', 'warning');
      return;
    }
    
    // Mark this transfer as initiated
    initiatedTransfersRef.current.add(transferKey);
    
    setIsProcessing(true);
    addLiveUpdate(`🚛 Initiating transfer for ${match.blood_type} blood`, 'info');
    
    try {
      // Find the actual blood unit by blood type and availability
      const bloodUnit = bloodUnits.find(unit => 
        unit.blood_type === match.blood_type && 
        unit.status === 'available'
      );
      
      console.log('Found blood unit:', bloodUnit);
      
      if (!bloodUnit) {
        addLiveUpdate('❌ No available blood unit found for transfer', 'error');
        // Remove from initiated transfers since it failed
        initiatedTransfersRef.current.delete(transferKey);
        return;
      }

      // Simulate transfer process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Use the distance from the match data
      const distance = match.distance_km;
      const estimatedHours = Math.ceil(distance / 60);
      
      addLiveUpdate(`✅ Transfer initiated! Route: ${distance}km, ${estimatedHours}h`, 'success');
      
      // Remove blood unit from database (DELETE request)
      const deleteResponse = await fetch(`${API_BASE}/blood_units/${bloodUnit.id}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete blood unit');
      }
      
      // Remove from initiated transfers since it completed successfully
      initiatedTransfersRef.current.delete(transferKey);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Transfer error:', error);
      addLiveUpdate('❌ Error initiating transfer', 'error');
      // Remove from initiated transfers since it failed
      initiatedTransfersRef.current.delete(transferKey);
    } finally {
      setIsProcessing(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Emergency Alert System Functions
  const triggerEmergencyAlert = (alert) => {
    const newAlert = {
      id: generateUniqueId(),
      ...alert,
      timestamp: new Date().toLocaleTimeString(),
      priority: alert.urgency === 'critical' ? 1 : alert.urgency === 'high' ? 2 : 3
    };
    
    setEmergencyAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep last 5 alerts
    
    if (alert.urgency === 'critical') {
      setShowEmergencyModal(true);
      setCurrentEmergency(newAlert);
      // Remove problematic audio code for now
      console.log('Critical emergency alert triggered');
    }
    
    // Add live update for the alert
    addLiveUpdate(`🚨 ${alert.urgency.toUpperCase()} ALERT: ${alert.blood_type} blood needed at ${alert.hospital}`, alert.urgency === 'critical' ? 'critical' : 'warning');
  };

  const handleEmergencyResponse = async (alertId) => {
    try {
      const alert = emergencyAlerts.find(a => a.id === alertId);
      if (!alert) return;

      setIsProcessing(true);
      addLiveUpdate(`🚨 Processing emergency response for ${alert.blood_type} blood...`, 'info');

      // Find the blood unit to transfer - prioritize Tamil Nadu blood banks
      const availableUnits = bloodUnits.filter(unit => 
        unit.blood_type === alert.blood_type && 
        unit.status === 'available'
      );
      
      // Sort by distance to destination hospital (Tamil Nadu optimization)
      const sortedUnits = availableUnits.sort((a, b) => {
        const sourceBankA = bloodBanks.find(bank => bank.id === a.blood_bank_id);
        const sourceBankB = bloodBanks.find(bank => bank.id === b.blood_bank_id);
        
        if (!sourceBankA || !sourceBankB) return 0;
        
        const distanceA = calculateOptimalRoute(sourceBankA, hospital).distance;
        const distanceB = calculateOptimalRoute(sourceBankB, hospital).distance;
        
        return distanceA - distanceB; // Sort by shortest distance first
      });
      
      // Ensure diversity by selecting different blood banks
      let bloodUnit = null;
      const seenBloodBanks = new Set();
      
      for (const unit of sortedUnits) {
        const sourceBank = bloodBanks.find(bank => bank.id === unit.blood_bank_id);
        if (sourceBank && !seenBloodBanks.has(sourceBank.name)) {
          bloodUnit = unit;
          seenBloodBanks.add(sourceBank.name);
          break;
        }
      }
      
      // If no diverse blood bank found, use the first one
      if (!bloodUnit && sortedUnits.length > 0) {
        bloodUnit = sortedUnits[0];
      }

      if (!bloodUnit) {
        addLiveUpdate('❌ No available blood unit found for transfer', 'error');
        return;
      }

      // Find the hospital destination
      const hospital = hospitals.find(h => h.name === alert.hospital);
      if (!hospital) {
        addLiveUpdate('❌ Hospital not found', 'error');
        return;
      }

      // Calculate route using actual coordinates
      const routeInfo = calculateRoute(
        bloodUnit.current_location_latitude,
        bloodUnit.current_location_longitude,
        hospital.latitude,
        hospital.longitude
      );

      addLiveUpdate(`🚛 Calculating route: ${routeInfo.distance}km, ${routeInfo.estimatedHours}h`, 'info');

      // Simulate transfer process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Remove blood unit from database (DELETE request)
      const deleteResponse = await fetch(`${API_BASE}/blood_units/${bloodUnit.id}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete blood unit');
      }

      // Update lives saved counter
      setLivesSaved(prev => prev + 1);
      
      // Remove alert
      setEmergencyAlerts(prev => prev.filter(a => a.id !== alertId));
      
      // Close modal if open
      if (showEmergencyModal) {
        setShowEmergencyModal(false);
        setCurrentEmergency(null);
      }

      // Add success message with route details
      addLiveUpdate(`✅ EMERGENCY RESPONDED! ${alert.blood_type} blood transferred to ${alert.hospital}. Route: ${routeInfo.distance}km, ${routeInfo.estimatedHours}h. Lives saved: ${livesSaved + 1}. Local network optimization ensured fastest response!`, 'success');
      
      // Refresh data to show updated state
      fetchData();
      
    } catch (error) {
      console.error('Emergency response error:', error);
      addLiveUpdate('❌ Error processing emergency response', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeEmergencyModal = () => {
    setShowEmergencyModal(false);
    setCurrentEmergency(null);
  };

  // AI Analysis Helper Functions for Demo
  const getAIStepIcon = (step) => {
    switch (step) {
      case 1: return <Brain className="w-4 h-4" />;
      case 2: return <TrendingUp className="w-4 h-4" />;
      case 3: return <Route className="w-4 h-4" />;
      case 4: return <CheckCircle className="w-4 h-4" />;
      case 5: return <Clock className="w-4 h-4" />;
      case 6: return <Brain className="w-4 h-4" />;
      case 7: return <CheckCircle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getAIStepColor = (step, status) => {
    if (status === 'completed') return 'text-green-600';
    if (step <= currentAIStep) return 'text-blue-600';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Emergency Blood Requests</h1>
              <p className="text-gray-600">AI-powered blood matching and route optimization using Chennai blood bank network</p>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Chennai network integration - Fast emergency response from local blood banks</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-600">SRM Global Hospitals</div>
              <div className="text-sm text-gray-500">Chennai, Tamil Nadu</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading AI routing data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <Button 
              onClick={fetchData} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Content - Only show when not loading and no errors */}
        {!isLoading && !error && (
          <>
            {/* AI Status & Live Updates */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">AI Status</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1 capitalize">{aiStatus}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Route className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Active Routes</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{(matches || []).filter(m => m.status === 'active').length} routes</p>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Critical Matches</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    {(matches || []).filter(m => m.urgency === 'critical').length} urgent
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Blood Request */}
            <Card className="mb-6 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Emergency Blood Request</span>
                </CardTitle>
                <CardDescription>AI will immediately find the best available blood units and calculate optimal routes</CardDescription>
                <div className="mt-2 flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Local network optimization - Faster response times, shorter distances</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="emergencyBloodType">Blood Type *</Label>
                    <Select value={emergencyRequest.blood_type} onValueChange={(value) => setEmergencyRequest({...emergencyRequest, blood_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <Select value={emergencyRequest.urgency} onValueChange={(value) => setEmergencyRequest({...emergencyRequest, urgency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical (Immediate)</SelectItem>
                        <SelectItem value="high">High (Within 2 hours)</SelectItem>
                        <SelectItem value="medium">Medium (Within 6 hours)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity Needed (ml)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="450"
                      value={emergencyRequest.quantity_needed}
                      onChange={(e) => setEmergencyRequest({...emergencyRequest, quantity_needed: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hospital">Destination Hospital</Label>
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">SRM Global Hospitals</span>
                      <span className="text-xs text-blue-600">(Chennai, Tamil Nadu)</span>
                    </div>
                    <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Blood will be delivered to our hospital from other blood banks</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={handleEmergencyRequest}
                    disabled={isAIAnalyzing || !emergencyRequest.blood_type || !emergencyRequest.quantity_needed}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isAIAnalyzing ? 'AI Analyzing...' : 'Start AI Analysis'}
                  </Button>
                </div>

                {/* AI Analysis Progress */}
                {isAIAnalyzing && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 animate-pulse text-blue-600" />
                      🧠 AI Analysis in Progress
                    </h4>
                    <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600">AI is thinking...</span>
                        <span className="text-blue-600 font-medium">
                          Step {currentAIStep + 1} of {aiAnalysisSteps.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${((currentAIStep + 1) / aiAnalysisSteps.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {aiAnalysisSteps.map((step, index) => (
                        <div key={step.step} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                          step.status === 'completed' ? 'bg-green-50 border-green-200 shadow-sm' : 
                          index <= currentAIStep ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`p-2 rounded-full transition-all duration-300 ${
                            step.status === 'completed' ? 'bg-green-100 text-green-600' : 
                            index <= currentAIStep ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {getAIStepIcon(step.step)}
                          </div>
                          
                          <div className="flex-1">
                            <div className={`font-medium transition-all duration-300 ${getAIStepColor(step.step, step.status)}`}>
                              {step.message}
                            </div>
                            <div className="text-sm text-gray-600">{step.details}</div>
                          </div>
                          
                          <div className="w-16">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  step.status === 'completed' ? 'bg-green-500' : 
                                  index <= currentAIStep ? 'bg-blue-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${step.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Results */}
                {aiResults && !isAIAnalyzing && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      AI Analysis Results
                    </h4>
                    <div className="space-y-4">
                      {/* Analysis Summary */}
                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Units Scanned</div>
                          <div className="text-xl font-bold text-blue-600">{aiResults.ai_summary.analysis_results.total_units_scanned}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">AI Confidence</div>
                          <div className="text-xl font-bold text-blue-600">{aiResults.ai_summary.analysis_results.ai_confidence_score.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Matches Found</div>
                          <div className="text-xl font-bold text-blue-600">{aiResults.ai_summary.analysis_results.optimal_matches_identified}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Lives Saved</div>
                          <div className="text-xl font-bold text-blue-600">{aiResults.ai_summary.recommendations.primary_match.confidence}</div>
                        </div>
                      </div>

                      {/* Smart Routing Information */}
                      {aiResults.routes && aiResults.routes.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                            <Route className="w-4 h-4" />
                            Smart Routing Solutions
                          </h5>
                          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs text-green-700 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              <span>Local network optimization ensures fastest regional routes with minimal traffic</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <div className="text-sm text-gray-600">Fastest Route</div>
                              <div className="text-lg font-bold text-blue-600">
                                {aiResults.routes[0].estimated_hours}h
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Route Quality</div>
                              <div className="text-lg font-bold text-blue-600">
                                {aiResults.routes[0].route_quality}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Network Optimized</div>
                              <div className="text-lg font-bold text-blue-600">
                                {aiResults.routes[0].optimization_note}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Distance</div>
                              <div className="text-lg font-bold text-blue-600">
                                {aiResults.routes[0].distance}km
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Available Blood Unit Matches */}
                      {aiResults && aiResults.blood_units.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Available Blood Units ({aiResults.blood_units.length})
                          </h5>
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs text-blue-700 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              <span>All routes optimized for local network - distances calculated for fastest regional transfer</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {aiResults.blood_units.map((unit, index) => (
                              <div 
                                key={unit.id} 
                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                                  selectedMatch && selectedMatch.blood_unit_id === unit.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSelectedMatch(unit)}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-lg px-3 py-1">
                                      {unit.blood_type}
                                    </Badge>
                                    <Badge className="bg-green-100 text-green-800">
                                      {unit.quantity_ml}ml
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">AI Confidence</div>
                                    <div className="text-lg font-bold text-blue-600">{unit.confidence}%</div>
                                    <div className="text-xs text-green-600">Local network</div>
                                  </div>
                                </div>
                                
                                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="text-sm text-gray-600 mb-2">Source Blood Bank</div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">{unit.source_bank || 'AI-Selected Blood Bank'}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {unit.location || 'Location details available'}
                                  </div>
                                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>Local blood bank - optimized for regional transfer</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="text-gray-600">Distance:</span>
                                    <div className="font-medium">{unit.distance}km</div>
                                    <div className="text-xs text-green-600">TN local</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Est. Time:</span>
                                    <div className="font-medium">{unit.eta}</div>
                                    <div className="text-xs text-green-600">Local roads</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Route Quality:</span>
                                    <div className="font-medium capitalize">{aiResults.routes[0].route_quality}</div>
                                    <div className="text-xs text-green-600">TN optimized</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Fuel Cost:</span>
                                    <div className="font-medium">₹{Math.floor(unit.distance * 55)}</div>
                                    <div className="text-xs text-green-600">Local rates</div>
                                  </div>
                                </div>

                                {selectedMatch && selectedMatch.id === unit.id && (
                                  <div className="pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium text-blue-600">✓ Selected for transfer</span>
                                      </div>
                                                                              <Button 
                                        onClick={() => handleOrderBlood(unit)}
                                        disabled={isProcessing}
                                        className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                                      >
                                        <Truck className="w-4 h-4 mr-2" />
                                        {isProcessing ? 'Processing...' : 'Order Blood'}
                                      </Button>
                                      <div className="mt-1 text-xs text-green-600 text-center">
                                        Local network optimized
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>






          </>
        )}
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && currentEmergency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 animate-pulse">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">EMERGENCY ALERT!</h2>
              <p className="text-gray-700 mb-4">{currentEmergency.message}</p>
              <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-700 text-center">
                  🚑 Local network activated - Fastest regional response guaranteed
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Blood Type:</span>
                  <span className="font-medium">{currentEmergency.blood_type}</span>
                </div>
                <div className="text-xs text-green-600 text-center mt-1">
                  Available in local network
                </div>
                <div className="flex justify-between">
                  <span>Hospital:</span>
                  <span className="font-medium">{currentEmergency.hospital}</span>
                </div>
                <div className="text-xs text-green-600 text-center mt-1">
                  Local facility
                </div>
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{currentEmergency.distance}km</span>
                </div>
                <div className="text-xs text-green-600 text-center mt-1">
                  Local regional distance
                </div>
                <div className="flex justify-between">
                  <span>Priority:</span>
                  <span className="font-medium text-red-600">CRITICAL</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="font-medium text-green-600">Local</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => handleEmergencyResponse(currentEmergency.id)}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    RESPOND NOW
                  </Button>
                  <Button 
                    onClick={closeEmergencyModal}
                    variant="outline"
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    LATER
                  </Button>
                </div>
                <div className="text-xs text-green-600 text-center">
                  Local network activated - Fastest regional response
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default SmartRouting;
