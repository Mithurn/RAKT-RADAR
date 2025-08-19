import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Circle,
  Building2,
  Heart,
  Truck,
  Activity,
  Eye,
  TrendingUp,
  AlertTriangle,
  Package
} from 'lucide-react';

const API_BASE = '/api';

const TrackingDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTransfers, setActiveTransfers] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransfers: 0,
    activeTransfers: 0,
    completedToday: 0,
    averageDeliveryTime: 0
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUser(user);
      fetchTrackingData(user);
    }
  }, []);

  const fetchTrackingData = async (userData) => {
    try {
      setLoading(true);
      
      // Fetch active transfers based on user role
      let endpoint = '';
      switch (userData.role) {
        case 'hospital':
          endpoint = '/routes/active/hospital';
          break;
        case 'blood_bank':
          endpoint = '/routes/active/blood-bank';
          break;
        case 'driver':
          endpoint = '/routes/active/driver';
          break;
        default:
          endpoint = '/routes/active';
      }

      const [activeResponse, recentResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE}${endpoint}`, { credentials: 'include' }),
        fetch(`${API_BASE}/routes/recent`, { credentials: 'include' }),
        fetch(`${API_BASE}/routes/stats`, { credentials: 'include' })
      ]);

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveTransfers(activeData.transfers || []);
      }

      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentTransfers(recentData.transfers || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      // Set demo data for development
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    setActiveTransfers([
      {
        id: 'TR001',
        blood_type: 'O+',
        quantity_ml: 450,
        source: 'Chennai Central Blood Bank',
        destination: 'Apollo Hospitals Chennai',
        status: 'in_transit',
        driver: 'Rajesh Kumar',
        eta_minutes: 25,
        progress: 65,
        distance_km: 12.5
      },
      {
        id: 'TR002',
        blood_type: 'A-',
        quantity_ml: 300,
        source: 'Madurai Blood Center',
        destination: 'Government Medical College',
        status: 'dispatched',
        driver: 'Suresh Patel',
        eta_minutes: 45,
        progress: 30,
        distance_km: 28.3
      }
    ]);

    setRecentTransfers([
      {
        id: 'TR003',
        blood_type: 'B+',
        quantity_ml: 500,
        source: 'Coimbatore Blood Bank',
        destination: 'PSG Hospitals',
        status: 'completed',
        driver: 'Mohan Singh',
        completed_at: '2024-01-15T14:30:00Z',
        delivery_time_minutes: 38
      }
    ]);

    setStats({
      totalTransfers: 156,
      activeTransfers: 2,
      completedToday: 8,
      averageDeliveryTime: 42
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'dispatched':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'dispatched':
        return <Package className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const handleViewTracking = (transferId) => {
    navigate(`/tracking?requestId=${transferId}`);
  };

  const handleViewDemoTracking = () => {
    console.log('Demo tracking button clicked, navigating to /tracking');
    navigate('/tracking');
  };

  const getRoleSpecificContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'hospital':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Incoming Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.activeTransfers}</div>
                <p className="text-xs text-gray-500">Active blood transfers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Today's Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                <p className="text-xs text-gray-500">Completed today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Delivery Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.averageDeliveryTime}m</div>
                <p className="text-xs text-gray-500">Minutes</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'blood_bank':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Outgoing Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.activeTransfers}</div>
                <p className="text-xs text-gray-500">Active deliveries</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalTransfers}</div>
                <p className="text-xs text-gray-500">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98.5%</div>
                <p className="text-xs text-gray-500">On-time delivery</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'driver':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.activeTransfers}</div>
                <p className="text-xs text-gray-500">Current deliveries</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Today's Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                <p className="text-xs text-gray-500">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">4.9★</div>
                <p className="text-xs text-gray-500">Rating</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Tracking Dashboard</h1>
          <p className="text-gray-600">
            Monitor all active blood transfers and delivery status in real-time
          </p>
        </div>

        {/* Role-specific stats */}
        {getRoleSpecificContent()}

        {/* Active Transfers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Transfers</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {activeTransfers.length} Active
            </Badge>
          </div>

          {activeTransfers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Transfers</h3>
                <p className="text-gray-500">There are currently no active blood transfers to track.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeTransfers.map((transfer) => (
                <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <CardTitle className="text-lg">{transfer.blood_type}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(transfer.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(transfer.status)}
                          <span className="capitalize">{transfer.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                    <CardDescription>
                      Transfer #{transfer.id} • {transfer.quantity_ml}ml
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">From:</span>
                        <span className="font-medium">{transfer.source}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">To:</span>
                        <span className="font-medium">{transfer.destination}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Driver:</span>
                        <span className="font-medium">{transfer.driver}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">ETA:</span>
                        <span className="font-medium text-blue-600">{transfer.eta_minutes} minutes</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">{transfer.distance_km} km</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{transfer.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${transfer.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleViewTracking(transfer.id)}
                        className="w-full mt-4"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Live Tracking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transfers */}
        {recentTransfers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transfers</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transfer ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTransfers.map((transfer) => (
                      <tr key={transfer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transfer.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>{transfer.blood_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(transfer.status)}>
                            {getStatusIcon(transfer.status)}
                            <span className="ml-1 capitalize">{transfer.status}</span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.driver}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.delivery_time_minutes || 'N/A'} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTracking(transfer.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/smart-routing')}
            >
              <MapPin className="w-6 h-6" />
              <span>Create Emergency Request</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/blood-management')}
            >
              <Package className="w-6 h-6" />
              <span>Blood Inventory</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => window.location.reload()}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Refresh Data</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={handleViewDemoTracking}
            >
              <MapPin className="w-6 h-6" />
              <span>Demo Tracking</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboard;
