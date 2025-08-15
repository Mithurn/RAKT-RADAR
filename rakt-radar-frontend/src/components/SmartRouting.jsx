import React, { useState, useEffect, useRef } from 'react';
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
  TrendingUp
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const SmartRouting = () => {
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
  
  // Ref to track processed matches and prevent duplicate alerts
  const processedMatchesRef = useRef(new Set());

  const [emergencyRequest, setEmergencyRequest] = useState({
    blood_type: '',
    urgency: 'high',
    hospital_id: '',
    quantity_needed: ''
  });

  useEffect(() => {
    console.log('SmartRouting - Component mounted, fetching data...');
    fetchData();
    // Real-time AI monitoring every 15 seconds
    const interval = setInterval(fetchMatches, 15000);
    return () => clearInterval(interval);
  }, []);

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
            
            // Create realistic hospital emergency scenarios
            const emergencyScenarios = [
              {
                hospital: "AIIMS Hyderabad 1",
                city: "Hyderabad",
                scenario: "Trauma Center - Multiple accident victims"
              },
              {
                hospital: "Narayana Health Ahmedabad 2", 
                city: "Ahmedabad",
                scenario: "Emergency Surgery - Critical patient"
              },
              {
                hospital: "Narayana Health Hyderabad 3",
                city: "Hyderabad", 
                scenario: "ICU - Severe blood loss"
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
              distance: Math.round((Math.random() * 20 + 5) * 100) / 100, // Random distance 5-25km
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
    if (!emergencyRequest.blood_type || !emergencyRequest.hospital_id || !emergencyRequest.quantity_needed) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    addLiveUpdate(`🚨 Emergency request: ${emergencyRequest.blood_type} blood needed`, 'emergency');

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find best matches
      const availableUnits = bloodUnits.filter(unit => 
        unit.blood_type === emergencyRequest.blood_type && 
        unit.status === 'available' &&
        !unit.is_flagged_for_expiry
      );

      if (availableUnits.length > 0) {
        const bestMatch = availableUnits[0];
        const sourceBank = bloodBanks.find(b => b.id === bestMatch.blood_bank_id);
        const destinationHospital = hospitals.find(h => h.id === emergencyRequest.hospital_id);
        
        const route = calculateOptimalRoute(sourceBank, destinationHospital);
        
        addLiveUpdate(`✅ AI found ${availableUnits.length} match(es) for emergency request`, 'success');
        
        setSelectedMatch({
          ...bestMatch,
          source: sourceBank,
          destination: destinationHospital,
          route,
          emergency: true
        });
      } else {
        addLiveUpdate(`❌ No available ${emergencyRequest.blood_type} blood units found`, 'error');
      }
    } catch (error) {
      addLiveUpdate('❌ Error processing emergency request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateOptimalRoute = (source, destination) => {
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
    
    // Calculate estimated travel time (assuming 60 km/h average)
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

      // Find the blood unit to transfer
      const bloodUnit = bloodUnits.find(unit => 
        unit.blood_type === alert.blood_type && 
        unit.status === 'available'
      );

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
      addLiveUpdate(`✅ EMERGENCY RESPONDED! ${alert.blood_type} blood transferred to ${alert.hospital}. Route: ${routeInfo.distance}km, ${routeInfo.estimatedHours}h. Lives saved: ${livesSaved + 1}`, 'success');
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Smart Routing & AI Matching</h1>
          <p className="text-gray-600">AI-powered blood distribution optimization with real-time routing</p>
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
                    <Select value={emergencyRequest.hospital_id} onValueChange={(value) => setEmergencyRequest({...emergencyRequest, hospital_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map(hospital => (
                          <SelectItem key={hospital.id} value={hospital.id}>{hospital.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={handleEmergencyRequest}
                    disabled={isProcessing || !emergencyRequest.blood_type || !emergencyRequest.hospital_id || !emergencyRequest.quantity_needed}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Processing...' : 'Find Emergency Match'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live AI Updates */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <span>Live AI Updates</span>
                </CardTitle>
                <CardDescription>Real-time system monitoring and AI decision making</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {liveUpdates.length === 0 ? (
                    <p className="text-gray-500 text-sm">No updates yet. AI is monitoring the system...</p>
                  ) : (
                    liveUpdates.map(update => (
                      <div key={update.id} className={`p-2 rounded text-sm ${
                        update.type === 'critical' ? 'bg-red-50 text-red-700' :
                        update.type === 'emergency' ? 'bg-orange-50 text-orange-700' :
                        update.type === 'success' ? 'bg-green-50 text-green-700' :
                        update.type === 'error' ? 'bg-red-50 text-red-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        <span className="font-medium">{update.timestamp}</span> - {update.message}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Alert System */}
            <div className="mb-6">
              {/* Active Emergency Alerts */}
              {emergencyAlerts.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span>🚨 ACTIVE EMERGENCY ALERTS ({emergencyAlerts.length})</span>
                    </CardTitle>
                    <CardDescription>Critical blood shortages requiring immediate response</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {emergencyAlerts.map((alert) => (
                        <div key={alert.id} className={`p-3 border rounded-lg ${
                          alert.urgency === 'critical' ? 'bg-red-100 border-red-300' :
                          alert.urgency === 'high' ? 'bg-orange-100 border-orange-300' :
                          'bg-yellow-100 border-yellow-300'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getUrgencyColor(alert.urgency)}>
                              {alert.urgency.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-600">{alert.timestamp}</span>
                          </div>
                          <p className="font-medium text-sm mb-1">{alert.message}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-600">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{alert.distance}km away</span>
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleEmergencyResponse(alert.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              RESPOND
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Matches & Routes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Matches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>AI-Powered Matches ({matches.length})</span>
                  </CardTitle>
                  <CardDescription>Intelligent blood demand-supply matching</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {matches.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No AI matches found yet</p>
                        <p className="text-xs text-gray-400 mt-1">AI is analyzing blood demand patterns...</p>
                      </div>
                    ) : (
                      matches.map((match, index) => (
                        <div key={`match-${match.id || match.entity_name}-${match.blood_type}-${match.distance_km || 0}-${index}`} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedMatch(match)}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{match.blood_type}</Badge>
                            <Badge className={getUrgencyColor(match.urgency)}>
                              {match.urgency}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{match.entity_name}</p>
                          <p className="text-xs text-gray-600">{match.city}, {match.state}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{match.distance_km}km</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{Math.ceil(match.distance_km / 60)}h</span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Route Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Route className="h-5 w-5 text-blue-600" />
                    <span>Route Details</span>
                  </CardTitle>
                  <CardDescription>Optimal transfer route and logistics</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedMatch ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Transfer Route</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">From:</span>
                            <span className="font-medium">{selectedMatch.source?.name || 'Blood Bank'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">To:</span>
                            <span className="font-medium">{selectedMatch.destination?.name || selectedMatch.entity_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Distance:</span>
                            <span className="font-medium">{selectedMatch.route?.distance || 'Calculating...'} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Est. Time:</span>
                            <span className="font-medium">{selectedMatch.route?.estimatedHours || 'Calculating...'} hours</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Blood Unit Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Blood Type:</span>
                            <Badge variant="outline">{selectedMatch.blood_type}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{selectedMatch.quantity_ml} ml</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <Badge className={selectedMatch.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {selectedMatch.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => initiateTransfer(selectedMatch)}
                        disabled={isProcessing || selectedMatch.status !== 'available'}
                        className="w-full"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Initiate Transfer'}
                      </Button>
                      
                      {/* Show transfer status */}
                      {isProcessing && (
                        <div className="text-center text-sm text-blue-600 mt-2">
                          <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                          Transfer in progress...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Route className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a match to view route details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
              
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Blood Type:</span>
                  <span className="font-medium">{currentEmergency.blood_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hospital:</span>
                  <span className="font-medium">{currentEmergency.hospital}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{currentEmergency.distance}km</span>
                </div>
                <div className="flex justify-between">
                  <span>Priority:</span>
                  <span className="font-medium text-red-600">CRITICAL</span>
                </div>
              </div>
              
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRouting;
