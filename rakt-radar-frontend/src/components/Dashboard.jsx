import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


import { 
  Activity, 
  AlertTriangle, 
  Droplet, 
  MapPin, 
  Clock,
  RefreshCw,
  Heart,
  CheckCircle
} from 'lucide-react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


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
  

  
  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

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
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">RAKT-RADAR</h1>
                    <p className="text-gray-600">Blood Management & Emergency Response System</p>
                    <div className="mt-1 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Chennai network integration for emergency support</span>
                    </div>
                  </div>
                  <div className="text-right ml-auto">
                    <div className="text-lg font-semibold text-blue-600">SRM Global Hospitals</div>
                    <div className="text-sm text-gray-500">Chennai, Tamil Nadu</div>
                  </div>
                </div>
              </div>
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
                <span className="text-sm font-medium text-green-700">Local Network Online</span>
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



        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Hospital Blood Units"
              value={analytics.inventory_summary.total_blood_units}
              description="Units in our blood bank"
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
              title="Chennai Network"
              value={analytics.network_summary.coverage_cities}
              description="Blood banks in Chennai"
              icon={MapPin}
              color="blue"
            />
          </div>
        )}

        {/* Main Content - Overview Only */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blood Type Distribution */}
                          <Card>
                <CardHeader>
                  <CardTitle>Hospital Blood Type Distribution</CardTitle>
                  <CardDescription>Our blood bank inventory by blood type</CardDescription>
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
                  <CardTitle>Hospital Performance</CardTitle>
                  <CardDescription>Our blood bank efficiency metrics</CardDescription>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

