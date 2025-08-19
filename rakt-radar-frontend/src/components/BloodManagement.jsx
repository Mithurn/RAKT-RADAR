import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Search, Filter, AlertTriangle, CheckCircle } from 'lucide-react';

const API_BASE = '/api';

const BloodManagement = () => {
  const [bloodUnits, setBloodUnits] = useState([]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [aiMatches, setAiMatches] = useState([]);

  const [newUnit, setNewUnit] = useState({
    blood_type: '',
    quantity_ml: '',
    collection_date: '',
    expiry_date: '',
    status: 'available'
  });

  useEffect(() => {
    fetchData();
    // Real-time AI monitoring - check for matches every 30 seconds
    // DISABLED: Automatic alerts to prevent unwanted popups
    // const interval = setInterval(checkForMatches, 30000);
    // return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const unitsRes = await fetch(`${API_BASE}/blood_units`);
      const unitsData = await unitsRes.json();
      setBloodUnits(unitsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const checkForMatches = async () => {
    try {
      const response = await fetch(`${API_BASE}/demand_matching`);
      const data = await response.json();
      const matches = data.matches || [];
      setAiMatches(matches);
      
      // DISABLED: Automatic critical alerts to prevent unwanted popups
      // Check for critical matches and show alerts
      // const criticalMatches = matches.filter(match => match.urgency === 'critical');
      // if (criticalMatches.length > 0) {
      //   showCriticalAlert(criticalMatches);
      // }
    } catch (error) {
      console.error('Error checking matches:', error);
    }
  };

  const showCriticalAlert = (matches) => {
    const message = `🚨 CRITICAL: ${matches.length} blood match(es) found!\n\n` +
      matches.map(match => 
        `${match.blood_type} blood needed at ${match.entity_name} (${match.city})\n` +
        `Distance: ${match.distance_km}km | Urgency: ${match.urgency}`
      ).join('\n\n');
    
    alert(message);
  };

  const handleAddUnit = async () => {
    try {
      // Get a valid blood bank ID dynamically
      let bloodBankId = newUnit.blood_bank_id;
      
      if (!bloodBankId) {
        // If no blood bank ID is set, get the first available one
        const bloodBanksResponse = await fetch(`${API_BASE}/blood_banks`);
        if (bloodBanksResponse.ok) {
          const bloodBanksData = await bloodBanksResponse.json();
          if (bloodBanksData.length > 0) {
            bloodBankId = bloodBanksData[0].id;
          }
        }
      }
      
      if (!bloodBankId) {
        alert('❌ No blood bank available. Please try again.');
        return;
      }

      // Add hospital blood bank ID and coordinates automatically
      const unitData = {
        ...newUnit,
        blood_bank_id: bloodBankId,
        current_location_latitude: 13.0827, // Chennai coordinates
        current_location_longitude: 80.2707
      };

      const response = await fetch(`${API_BASE}/blood_units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitData)
      });

      if (response.ok) {
        alert('✅ Blood unit added successfully! AI is now analyzing for potential matches...');
        setNewUnit({
          blood_type: '',
          quantity_ml: '',
          collection_date: '',
          expiry_date: '',
          status: 'available'
        });
        setIsAdding(false);
        fetchData();
        
        // Trigger AI analysis immediately
        setTimeout(checkForMatches, 2000);
      } else {
        const errorData = await response.json();
        alert(`❌ Error adding blood unit: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('❌ Error adding blood unit');
      console.error(error);
    }
  };

  const handleEditUnit = async (unitId, updatedData) => {
    try {
      const response = await fetch(`${API_BASE}/blood_units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        alert('✅ Blood unit updated successfully!');
        setEditingUnit(null);
        fetchData();
        checkForMatches();
      }
    } catch (error) {
      alert('❌ Error updating blood unit');
      console.error(error);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (confirm('Are you sure you want to delete this blood unit?')) {
      try {
        const response = await fetch(`${API_BASE}/blood_units/${unitId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('✅ Blood unit deleted successfully!');
          fetchData();
        }
      } catch (error) {
        alert('❌ Error deleting blood unit');
        console.error(error);
      }
    }
  };

  const filteredUnits = bloodUnits.filter(unit => {
    const matchesSearch = unit.blood_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || unit.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 0) return { status: 'expired', color: 'text-red-600', icon: '🚨' };
    if (daysUntilExpiry <= 3) return { status: 'critical', color: 'text-red-600', icon: '⚠️' };
    if (daysUntilExpiry <= 7) return { status: 'warning', color: 'text-orange-600', icon: '⚠️' };
    return { status: 'safe', color: 'text-green-600', icon: '✅' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blood Management System</h1>
              <p className="text-gray-600">AI-powered blood inventory management for our hospital blood bank</p>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Chennai network integration for emergency support</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-600">SRM Global Hospitals</div>
              <div className="text-sm text-gray-500">Chennai, Tamil Nadu</div>
            </div>
          </div>
        </div>

        {/* AI Status & Critical Alerts */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">AI System Active</span>
              </div>
              <p className="text-xs text-green-600 mt-1">Monitoring {bloodUnits.length} blood units</p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">AI Matches Found</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">{aiMatches.length} potential matches</p>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Expiry Alerts</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {bloodUnits.filter(u => getExpiryStatus(u.expiry_date).status === 'critical').length} critical
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add New Blood Unit */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-600" />
              <span>Add New Blood Unit</span>
            </CardTitle>
            <CardDescription>Add new blood units to our hospital blood bank. Blood bank and location are automatically set for SRM Global Hospitals Chennai. AI will automatically analyze for matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bloodType">Blood Type *</Label>
                <Select value={newUnit.blood_type} onValueChange={(value) => setNewUnit({...newUnit, blood_type: value})}>
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
                <Label htmlFor="quantity">Quantity (ml) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="450"
                  value={newUnit.quantity_ml}
                  onChange={(e) => setNewUnit({...newUnit, quantity_ml: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="collectionDate">Collection Date *</Label>
                <Input
                  id="collectionDate"
                  type="date"
                  value={newUnit.collection_date}
                  onChange={(e) => setNewUnit({...newUnit, collection_date: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newUnit.expiry_date}
                  onChange={(e) => setNewUnit({...newUnit, expiry_date: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-4">
                <Button 
                  onClick={handleAddUnit}
                  disabled={!newUnit.blood_type || !newUnit.quantity_ml || !newUnit.collection_date || !newUnit.expiry_date}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blood Unit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Blood Units</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by blood type, status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="filter">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blood Units Table */}
        <Card>
          <CardHeader>
            <CardTitle>Blood Inventory ({filteredUnits.length} units)</CardTitle>
            <CardDescription>Our hospital blood bank inventory with AI monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Blood Type</th>
                    <th className="text-left p-2">Quantity</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Collection Date</th>
                    <th className="text-left p-2">Expiry Date</th>
                    <th className="text-left p-2">Expiry Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((unit) => {
                    const expiryStatus = getExpiryStatus(unit.expiry_date);
                    
                    return (
                      <tr key={unit.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <Badge variant="outline">{unit.blood_type}</Badge>
                        </td>
                        <td className="p-2">{unit.quantity_ml} ml</td>
                        <td className="p-2">
                          <Badge className={getStatusColor(unit.status)}>
                            {unit.status}
                          </Badge>
                        </td>
                        <td className="p-2">{new Date(unit.collection_date).toLocaleDateString()}</td>
                        <td className="p-2">{new Date(unit.expiry_date).toLocaleDateString()}</td>
                        <td className="p-2">
                          <span className={`flex items-center space-x-1 ${expiryStatus.color}`}>
                            <span>{expiryStatus.icon}</span>
                            <span className="text-sm">{expiryStatus.status}</span>
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUnit(unit)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUnit(unit.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BloodManagement;
