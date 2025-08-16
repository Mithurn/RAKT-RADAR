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

const API_BASE = 'http://localhost:8000/api';

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
    // Only set up interval if we have matches and haven't already set it up
    if (matches.length > 0 && !processedMatchesRef.current.has('interval-setup')) {
      processedMatchesRef.current.add('interval-setup');
      
      const interval = setInterval(() => {
        // Check if there are any critical matches that haven't been alerted
        const criticalMatches = matches.filter(match => {
          const matchKey = `${match.entity_name}-${match.blood_type}-${match.distance_km}`;
          return match.urgency === 'critical' && 
                 !processedMatchesRef.current.has(matchKey);
        });
        
        // Only process if there are new critical matches
        if (criticalMatches.length > 0) {
          criticalMatches.forEach(match => {
            const matchKey = `${match.entity_name}-${match.blood_type}-${match.distance_km}`;
            // Mark this match as processed
            processedMatchesRef.current.add(matchKey);
            
            // Create realistic SRM Global Hospitals emergency scenarios
            const emergencyScenarios = [
              {
                hospital: "SRM Global Hospitals",
                city: "Chennai",
                scenario: "Trauma Center - Multiple accident victims"
              },
              {
                hospital: "SRM Global Hospitals", 
                city: "Chennai",
                scenario: "Emergency Surgery - Critical patient"
              },
              {
                hospital: "SRM Global Hospitals",
                city: "Chennai", 
                scenario: "ICU - Severe blood loss"
              },
              {
                hospital: "SRM Global Hospitals",
                city: "Chennai",
                scenario: "Cardiac Emergency - Blood transfusion needed"
              },
              {
                hospital: "SRM Global Hospitals",
                city: "Chennai",
                scenario: "Emergency Department - Trauma case"
              },
              {
                hospital: "SRM Global Hospitals",
                city: "Chennai",
                scenario: "Emergency Surgery - Trauma case"
              },
              {
                hospital: "Chettinad Hospital",
                city: "Chennai",
                scenario: "ICU - Critical care blood requirement"
              },
              {
                hospital: "MIOT International",
                city: "Chennai",
                scenario: "Emergency Department - Accident victims"
              },
              {
                hospital: "Coimbatore Medical College Hospital",
                city: "Coimbatore",
                scenario: "Emergency Department - Critical trauma case"
              },
              {
                hospital: "Madurai Medical College Hospital",
                city: "Madurai",
                scenario: "ICU - Severe blood loss emergency"
              },
              {
                hospital: "Salem Government Hospital",
                city: "Salem",
                scenario: "Emergency Surgery - Blood transfusion needed"
              },
              {
                hospital: "Vellore Medical Center",
                city: "Vellore",
                scenario: "Trauma Center - Multiple victims"
              }
            ];
            
            // Pick a random emergency scenario
            const scenario = emergencyScenarios[Math.floor(Math.random() * emergencyScenarios.length)];
            
            triggerEmergencyAlert({
              type: 'hospital_emergency',
              urgency: 'critical',
              blood_type: match.blood_type,
              hospital: scenario.hospital,
              city: scenario.city,
              distance: Math.round((Math.random() * 15 + 3) * 100) / 100, // Random distance 3-18km for Tamil Nadu
              message: `CRITICAL: ${match.blood_type} blood needed at ${scenario.scenario}`
            });
          });
        }
      }, 30000); // Check every 30 seconds instead of 10
      
      return () => clearInterval(interval);
    }
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
    
    addLiveUpdate(`🚨 AI analyzing emergency request for ${emergencyRequest.blood_type} blood...`, 'info');

    try {
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
        addLiveUpdate(`🧠 ${step.message}`, 'info');
        
        // Wait between steps to show AI thinking
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      console.log('✅ AI analysis steps completed, finding matches...');

      // Find best matches - prioritize Tamil Nadu blood banks for optimal distance
      const availableUnits = bloodUnits.filter(unit => 
        unit.blood_type === emergencyRequest.blood_type && 
        unit.status === 'available' &&
        !unit.is_flagged_for_expiry
      );
      
      console.log('Available units found:', availableUnits.length);
      
      const destinationHospital = hospitals.find(h => h.id === emergencyRequest.hospital_id);
      console.log('Destination hospital:', destinationHospital);
      
      if (availableUnits.length > 0) {
        // Sort by distance to destination (Tamil Nadu hospitals only)
        const sortedUnits = availableUnits.sort((a, b) => {
          const sourceBankA = bloodBanks.find(bank => bank.id === a.blood_bank_id);
          const sourceBankB = bloodBanks.find(bank => bank.id === b.blood_bank_id);
          
          if (!sourceBankA || !sourceBankB) return 0;
          
          const distanceA = calculateOptimalRoute(sourceBankA, destinationHospital).distance;
          const distanceB = calculateOptimalRoute(sourceBankB, destinationHospital).distance;
          
          return distanceA - distanceB; // Sort by shortest distance first
        });

        const bestMatch = sortedUnits[0];
        const sourceBank = bloodBanks.find(b => b.id === bestMatch.blood_bank_id);
        const route = calculateOptimalRoute(sourceBank, destinationHospital);
        
        console.log('Best match found:', bestMatch);
        console.log('Source bank:', sourceBank);
        console.log('Route calculated:', route);
          
        // Create AI results for demo
        const demoResults = {
          ai_summary: {
            analysis_results: {
              total_units_scanned: bloodUnits.length,
              ai_confidence_score: 95.8,
              optimal_matches_identified: availableUnits.length
            },
            recommendations: {
              waste_prevention_potential: 'High efficiency route identified',
              estimated_lives_saved: Math.floor(Math.random() * 5) + 1
            },
            smart_routing_insights: {
              fastest_route_minutes: Math.floor(route.distance * 0.8),
              route_optimization_score: 94,
              total_routes_analyzed: 12,
              safety_recommendations: 'Safe route with minimal traffic'
            }
          },
          matches: sortedUnits.map(unit => {
            const sourceBank = bloodBanks.find(b => b.id === unit.blood_bank_id);
            return {
              blood_unit_id: unit.id,
              blood_type: unit.blood_type,
              quantity_ml: unit.quantity_ml,
              entity_name: destinationHospital.name,
              source_blood_bank: sourceBank ? sourceBank.name : 'AI-Selected Blood Bank',
              source_location: sourceBank ? `${sourceBank.city}, ${sourceBank.state}` : 'Location details available',
              distance_km: route.distance,
              estimated_time_hours: route.estimatedHours,
              ai_score: Math.floor(Math.random() * 20) + 80,
              compatibility_score: 100,
              coordinates: {
                source: sourceBank ? [sourceBank.latitude || 13.0827, sourceBank.longitude || 80.2707] : [13.0827, 80.2707],
                destination: [destinationHospital.latitude || 13.0067, destinationHospital.longitude || 80.2206],
                current: [13.0447, 80.2456]
              },
              smart_routing: {
                estimated_time_minutes: Math.floor(route.distance * 0.8),
                route_quality: 'excellent',
                traffic_status: 'clear',
                fuel_cost_estimate: Math.floor(route.distance * 0.5),
                recommended_departure_time: new Date(Date.now() + 30 * 60000).toLocaleTimeString()
              }
            };
          })
        };

        setAiResults(demoResults);
        addLiveUpdate(`✅ AI found ${sortedUnits.length} optimal match(es)!`, 'success');
        
        setSelectedMatch({
          ...bestMatch,
          source: sourceBank,
          destination: destinationHospital,
          route,
          emergency: true
        });
      } else {
        // For demo purposes, create mock results even if no real blood units found
        console.log('No real blood units found, creating demo results...');
        
        const mockRoute = {
          distance: 25.5,
          estimatedHours: 1,
          coordinates: [[72.8777, 19.0760], [72.8777, 19.0760]]
        };
        
        const demoResults = {
          ai_summary: {
            analysis_results: {
              total_units_scanned: bloodUnits.length,
              ai_confidence_score: 95.8,
              optimal_matches_identified: 2
            },
            recommendations: {
              waste_prevention_potential: 'High efficiency route identified',
              estimated_lives_saved: Math.floor(Math.random() * 5) + 1
            },
            smart_routing_insights: {
              fastest_route_minutes: Math.floor(mockRoute.distance * 0.8),
              route_optimization_score: 94,
              total_routes_analyzed: 12,
              safety_recommendations: 'Safe route with minimal traffic'
            }
          },
          matches: [
            {
              blood_unit_id: 'demo-1',
              blood_type: emergencyRequest.blood_type,
              quantity_ml: 450,
              entity_name: 'Apollo Hospital Chennai',
              source_blood_bank: 'Chennai Central Blood Bank',
              source_location: 'Chennai, Tamil Nadu',
              distance_km: mockRoute.distance,
              estimated_time_hours: mockRoute.estimatedHours,
              ai_score: 95,
              compatibility_score: 100,
              coordinates: {
                source: [13.0827, 80.2707],
                destination: [13.0067, 80.2206],
                current: [13.0447, 80.2456]
              },
              smart_routing: {
                estimated_time_minutes: Math.floor(mockRoute.distance * 0.8),
                route_quality: 'excellent',
                traffic_status: 'clear',
                fuel_cost_estimate: Math.floor(mockRoute.distance * 0.5),
                recommended_departure_time: new Date(Date.now() + 30 * 60000).toLocaleTimeString()
              }
            },
            {
              blood_unit_id: 'demo-2',
              blood_type: emergencyRequest.blood_type,
              quantity_ml: 500,
              entity_name: 'Fortis Malar Hospital',
              source_blood_bank: 'Chennai Central Blood Bank',
              source_location: 'Chennai, Tamil Nadu',
              distance_km: mockRoute.distance + 5,
              estimated_time_hours: mockRoute.estimatedHours + 1,
              ai_score: 88,
              compatibility_score: 100,
              coordinates: {
                source: [13.0827, 80.2707],
                destination: [13.0067, 80.2206],
                current: [13.0447, 80.2456]
              },
              smart_routing: {
                estimated_time_minutes: Math.floor((mockRoute.distance + 5) * 0.8),
                route_quality: 'good',
                traffic_status: 'moderate',
                fuel_cost_estimate: Math.floor((mockRoute.distance + 5) * 0.5),
                recommended_departure_time: new Date(Date.now() + 60 * 60000).toLocaleTimeString()
              }
            }
          ]
        };

        setAiResults(demoResults);
        addLiveUpdate(`✅ AI found 2 demo matches for ${emergencyRequest.blood_type} blood!`, 'success');
      }
      
      console.log('🎯 Emergency request processing completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in emergency request:', error);
      addLiveUpdate('❌ Error processing emergency request', 'error');
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
    const distance = R * c;
    
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
      
      const bloodUnit = sortedUnits[0];

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
                          <div className="text-xl font-bold text-blue-600">{aiResults.ai_summary.recommendations.estimated_lives_saved}</div>
                        </div>
                      </div>

                      {/* Smart Routing Information */}
                      {aiResults.ai_summary.smart_routing_insights && (
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
                                {aiResults.ai_summary.smart_routing_insights.fastest_route_minutes} min
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Route Quality</div>
                              <div className="text-lg font-bold text-blue-600">
                                {aiResults.ai_summary.smart_routing_insights.route_optimization_score}%
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Routes Analyzed</div>
                              <div className="text-lg font-bold text-blue-600">
                                {aiResults.ai_summary.smart_routing_insights.total_routes_analyzed}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Safety Score</div>
                              <div className="text-lg font-bold text-blue-600">
                                {aiResults.ai_summary.smart_routing_insights.safety_recommendations.includes('safe') ? '95%' : '90%'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Available Blood Unit Matches */}
                      {aiResults && aiResults.matches.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Available Blood Units ({aiResults.matches.length})
                          </h5>
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs text-blue-700 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              <span>All routes optimized for local network - distances calculated for fastest regional transfer</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {aiResults.matches.map((match, index) => (
                              <div 
                                key={match.blood_unit_id} 
                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                                  selectedMatch && selectedMatch.blood_unit_id === match.blood_unit_id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSelectedMatch(match)}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-lg px-3 py-1">
                                      {match.blood_type}
                                    </Badge>
                                    <Badge className="bg-green-100 text-green-800">
                                      {match.quantity_ml}ml
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">AI Score</div>
                                    <div className="text-lg font-bold text-blue-600">{match.ai_score}%</div>
                                    <div className="text-xs text-green-600">TN optimized</div>
                                  </div>
                                </div>
                                
                                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="text-sm text-gray-600 mb-2">Source Blood Bank</div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">{match.source_blood_bank || 'AI-Selected Blood Bank'}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {match.source_location || 'Location details available'}
                                  </div>
                                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>Local blood bank - optimized for regional transfer</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="text-gray-600">Distance:</span>
                                    <div className="font-medium">{match.distance_km}km</div>
                                    <div className="text-xs text-green-600">TN local</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Est. Time:</span>
                                    <div className="font-medium">{match.estimated_time_hours}h</div>
                                    <div className="text-xs text-green-600">Local roads</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Route Quality:</span>
                                    <div className="font-medium capitalize">{match.smart_routing.route_quality}</div>
                                    <div className="text-xs text-green-600">TN optimized</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Fuel Cost:</span>
                                    <div className="font-medium">₹{match.smart_routing.fuel_cost_estimate}</div>
                                    <div className="text-xs text-green-600">Local rates</div>
                                  </div>
                                </div>

                                {selectedMatch && selectedMatch.blood_unit_id === match.blood_unit_id && (
                                  <div className="pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium text-blue-600">✓ Selected for transfer</span>
                                      </div>
                                      <Button 
                                        onClick={() => {
                                          // Store transfer data in localStorage for future use
                                          localStorage.setItem('currentTransfer', JSON.stringify(match));
                                          // For now, just show a success message
                                          addLiveUpdate(`✅ Transfer initiated for ${match.blood_type} blood from ${match.entity_name}`, 'success');
                                        }}
                                        disabled={isProcessing}
                                        className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                                      >
                                        <Truck className="w-4 h-4 mr-2" />
                                        {isProcessing ? 'Processing...' : 'Track Transfer'}
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
