import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Building2, 
  Droplets, 
  Truck, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  AlertTriangle
} from 'lucide-react';

const API_BASE = '/api';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const demoCredentials = {
    hospital: { username: 'apollo_hospital', password: 'hospital123', role: 'hospital' },
    blood_bank: { username: 'chennai_blood_bank', password: 'bank123', role: 'blood_bank' },
    driver: { username: 'demo_driver', password: 'driver123', role: 'driver' },
    admin: { username: 'admin', password: 'admin123', role: 'admin' }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.role) {
      setError('Please fill in all fields');
      return;
    }

    console.log('Attempting login with:', formData); // Debug log
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status); // Debug log
      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (response.ok && data.success) {
        console.log('Login successful:', data); // Debug log
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('entity_details', JSON.stringify(data.entity_details));
        localStorage.setItem('session_token', data.session_token);
        
        console.log('Data stored in localStorage'); // Debug log
        
        // TEMPORARY: Force redirect without callback
        console.log('FORCING REDIRECT to role:', data.user.role); // Debug log
        
        // Force page reload and redirect to centralized dashboard
        window.location.href = '/dashboard';
        
        return; // Exit early
        
        // Call the parent component's onLoginSuccess to update authentication state
        if (onLoginSuccess) {
          console.log('Calling onLoginSuccess callback'); // Debug log
          onLoginSuccess(data.user, data.entity_details);
        } else {
          console.log('onLoginSuccess callback not provided'); // Debug log
        }
        
        // Redirect based on role immediately
        console.log('Redirecting to role:', data.user.role); // Debug log
        switch (data.user.role) {
          case 'hospital':
            window.location.href = '/';
            break;
          case 'blood_bank':
            window.location.href = '/blood-bank/dashboard';
            break;
          case 'driver':
            window.location.href = '/driver/routes';
            break;
          case 'admin':
            window.location.href = '/admin';
            break;
          default:
            window.location.href = '/';
        }
      } else {
        console.log('Login failed:', data.error); // Debug log
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err); // Debug log
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role) => {
    const creds = demoCredentials[role];
    setFormData(creds);
    setError('');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'hospital':
        return <Building2 className="w-5 h-5" />;
      case 'blood_bank':
        return <Droplets className="w-5 h-5" />;
      case 'driver':
        return <Truck className="w-5 h-5" />;
      case 'admin':
        return <User className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'hospital':
        return 'Access emergency request system and track deliveries';
      case 'blood_bank':
        return 'Manage inventory and approve blood requests';
      case 'driver':
        return 'View routes and update delivery progress';
      case 'admin':
        return 'System administration and monitoring';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Droplets className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              RAKT-RADAR
            </CardTitle>
            <CardDescription className="text-gray-600">
              AI-Powered Blood Bank Management System
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>Hospital</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="blood_bank">
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4" />
                        <span>Blood Bank</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="driver">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4" />
                        <span>Driver</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-blue-800">
                    {getRoleIcon(formData.role)}
                    <span className="font-medium capitalize">{formData.role.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {getRoleDescription(formData.role)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              >
                {showDemoCredentials ? 'Hide' : 'Show'} Demo Credentials
              </Button>
              
              {showDemoCredentials && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 font-medium">Quick Login:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(demoCredentials).map(([role, creds]) => (
                      <Button
                        key={role}
                        variant="outline"
                        size="sm"
                        onClick={() => fillDemoCredentials(role)}
                        className="text-xs h-8"
                      >
                        {getRoleIcon(role)}
                        <span className="ml-1 capitalize">{role.replace('_', ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>RAKT-RADAR - Saving Lives Through AI</p>
          <p className="mt-1">Hackathon Demo System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
