import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  AlertTriangle, 
  Building2, 
  Droplet, 
  Brain, 
  MapPin, 
  TrendingUp,
  Users,
  Zap,
  Clock,
  RefreshCw,
  Heart,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateUniqueId } from '../lib/utils';

const API_BASE = 'http://localhost:8000/api';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState({});
  const [flaggedUnits, setFlaggedUnits] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [liveCounter, setLiveCounter] = useState(0);
  
  // Emergency Alert System
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [livesSaved, setLivesSaved] = useState(0);
  
  // Ref to track processed matches and prevent duplicate alerts
  const processedMatchesRef = useRef(new Set());

  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

  // Separate useEffect for emergency alert monitoring
  useEffect(() => {
    // Debug: Check for duplicate keys in matches
    if (matches.length > 0) {
      const keys = matches.slice(0, 5).map((match, index) => `match-${match.id || match.entity_name}-${match.blood_type}-${match.distance_km || 0}-${index}`);
      const uniqueKeys = new Set(keys);
      if (keys.length !== uniqueKeys.size) {
        console.warn('Dashboard - Duplicate keys detected in matches:', {
          totalMatches: matches.length,
          uniqueKeys: uniqueKeys.size,
          duplicateKeys: keys.length - uniqueKeys.size
        });
        console.log('Match data for debugging:', matches.slice(0, 5));
      }
    }
    
    // Only set up interval if we have matches and haven't already set it up
    if (matches.length > 0 && !processedMatchesRef.current.has('interval-setup')) {
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
      }, 45000); // Check every 45 seconds instead of 15
      
      return () => clearInterval(interval);
    }
  }, [matches]); // Remove emergencyAlerts from dependencies

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, flaggedRes, hospitalsRes, bloodBanksRes, matchesRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard`),
        fetch(`${API_BASE}/blood_units/flagged_for_expiry`),
        fetch(`${API_BASE}/hospitals`),
        fetch(`${API_BASE}/blood_banks`),
        fetch(`${API_BASE}/demand_matching`)
      ]);

      const analyticsData = await analyticsRes.json();
      const flaggedData = await flaggedRes.json();
      const hospitalsData = await hospitalsRes.json();
      const bloodBanksData = await bloodBanksRes.json();
      const matchesData = await matchesRes.json();

      setAnalytics(analyticsData);
      setFlaggedUnits(flaggedData);
      setHospitals(hospitalsData);
      setBloodBanks(bloodBanksData);
      
      // Deduplicate matches based on a unique identifier
      const initialMatches = matchesData.matches || [];
      const uniqueInitialMatches = initialMatches.filter((match, index, self) => {
        const matchKey = `${match.entity_name}-${match.blood_type}-${match.distance_km}`;
        return index === self.findIndex(m => 
          `${m.entity_name}-${m.blood_type}-${m.distance_km}` === matchKey
        );
      });
      
      setMatches(uniqueInitialMatches);
      
      // Don't trigger emergency alerts immediately on data fetch
      // Let the interval-based system handle it to prevent infinite loops
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await fetchData();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Route calculation function
  const calculateRoute = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
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

  // Emergency Alert System Functions
  const triggerEmergencyAlert = (alert) => {
    const newAlert = {
      id: generateUniqueId(),
      ...alert,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setEmergencyAlerts(prev => [newAlert, ...prev.slice(0, 3)]); // Keep last 4 alerts
    
    if (alert.urgency === 'critical') {
      // Remove problematic audio code for now
      console.log('Critical emergency alert triggered');
    }
  };

  const handleEmergencyResponse = async (alertId) => {
    try {
      const alert = emergencyAlerts.find(a => a.id === alertId);
      if (!alert) return;

      // Find the blood unit to transfer
      const bloodUnit = flaggedUnits.find(unit => 
        unit.blood_type === alert.blood_type && 
        unit.status === 'available'
      );

      if (!bloodUnit) {
        console.error('No available blood unit found for transfer');
        return;
      }

      // Find the hospital destination
      const hospital = hospitals.find(h => h.name === alert.hospital);
      if (!hospital) {
        console.error('Hospital not found');
        return;
      }

      // Calculate route using actual coordinates
      const routeInfo = calculateRoute(
        bloodUnit.current_location_latitude,
        bloodUnit.current_location_longitude,
        hospital.latitude,
        hospital.longitude
      );

      console.log(`Route calculated: ${routeInfo.distance}km, ${routeInfo.estimatedHours}h`);

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
      
      // Refresh data to show updated state
      fetchData();
      
    } catch (error) {
      console.error('Emergency response error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const bloodTypeData = analytics ? Object.entries(analytics.blood_type_distribution).map(([type, count]) => ({
    name: type,
    value: count
  })) : [];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

  const StatCard = ({ title, value, description, icon: Icon, trend, color = "blue" }) => (
    <Card className={`border-l-4 border-l-${color}-500`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            <span className="text-xs text-green-600">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">RAKT-RADAR</h1>
                <p className="text-gray-600">Blood Bank Management & Intelligence System</p>
              </div>
            </div>
            
            {/* Lives Saved Counter - Top Right Corner */}
            <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg text-white p-3 text-center min-w-[100px] shadow-lg">
              <div className="text-xl font-bold mb-1">🩸 {livesSaved}</div>
              <div className="text-xs opacity-90">LIVES SAVED</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4" />
              <span>Live Dashboard</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium">{lastUpdated.toLocaleTimeString()}</p>
            </div>
            <Button onClick={refreshData} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Live System Status */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Live Counter: {liveCounter}s</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium">{lastUpdated.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

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
                        <Badge className={alert.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
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

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Blood Units"
              value={analytics.inventory_summary.total_blood_units}
              description="Units in system"
              icon={Droplet}
              color="red"
            />
            <StatCard
              title="Available Units"
              value={analytics.inventory_summary.available_units}
              description="Ready for use"
              icon={Heart}
              color="green"
            />
            <StatCard
              title="Critical Alerts"
              value={analytics.alerts.critical_expiry_alerts}
              description="Units nearing expiry"
              icon={AlertTriangle}
              color="yellow"
            />
            <StatCard
              title="Network Coverage"
              value={analytics.network_summary.coverage_cities}
              description="Cities covered"
              icon={MapPin}
              color="blue"
            />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blood Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Blood Type Distribution</CardTitle>
                  <CardDescription>Current inventory by blood type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={bloodTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {bloodTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Efficiency Metrics */}
              {analytics && (
                <Card>
                  <CardHeader>
                    <CardTitle>System Efficiency</CardTitle>
                    <CardDescription>Key performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Wastage Prevention Rate</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {analytics.efficiency_metrics.wastage_prevention_rate}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Transfer Success Rate</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {analytics.efficiency_metrics.transfer_success_rate}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg Response Time</span>
                      <Badge variant="secondary">
                        {analytics.efficiency_metrics.average_response_time_hours}h
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Cost Savings</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ₹{analytics.efficiency_metrics.cost_savings_inr.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            {/* Flagged Units */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Units Nearing Expiry</span>
                </CardTitle>
                <CardDescription>Blood units that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedUnits.length > 0 ? (
                  <div className="space-y-3">
                    {flaggedUnits.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            {unit.blood_type}
                          </Badge>
                          <div>
                            <p className="font-medium">{unit.blood_bank_name}</p>
                            <p className="text-sm text-gray-600">{unit.blood_bank_city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{unit.quantity_ml}ml</p>
                          <p className="text-sm text-red-600">Expires in {unit.days_until_expiry} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No units currently flagged for expiry</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Demand Matching</span>
                </CardTitle>
                <CardDescription>AI-powered matches for optimal blood distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length > 0 ? (
                  <div className="space-y-3">
                    {matches.slice(0, 5).map((match, index) => (
                      <div key={`match-${match.id || match.entity_name}-${match.blood_type}-${match.distance_km || 0}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {match.blood_type}
                          </Badge>
                          <div>
                            <p className="font-medium">{match.entity_name}</p>
                            <p className="text-sm text-gray-600">{match.city}, {match.state}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="secondary" 
                            className={
                              match.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                              match.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {match.urgency}
                          </Badge>
                          <p className="text-sm text-gray-600">{match.distance_km}km away</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No matches found at this time</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hospitals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <span>Hospitals ({hospitals.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {hospitals.slice(0, 10).map((hospital) => (
                      <div key={hospital.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{hospital.name}</p>
                          <p className="text-xs text-gray-600">{hospital.city}, {hospital.state}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">Hospital</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Blood Banks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Droplet className="h-5 w-5 text-red-600" />
                    <span>Blood Banks ({bloodBanks.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bloodBanks.map((bank) => (
                      <div key={bank.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{bank.name}</p>
                          <p className="text-xs text-gray-600">{bank.city}, {bank.state}</p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Blood Bank</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

