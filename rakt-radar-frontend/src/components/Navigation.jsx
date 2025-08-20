import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Building2, 
  Droplets, 
  Truck, 
  User, 
  LogOut,
  Menu,
  X,
  MapPin,
  Activity,
  Package
} from 'lucide-react';

const Navigation = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
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

  const getRoleName = (role) => {
    switch (role) {
      case 'hospital':
        return 'Hospital';
      case 'blood_bank':
        return 'Blood Bank';
      case 'driver':
        return 'Driver';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'hospital':
        return [
          { path: '/', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
          { path: '/blood-management', label: 'Blood Management', icon: <Package className="w-4 h-4" /> },
          { path: '/smart-routing', label: 'Emergency Requests', icon: <MapPin className="w-4 h-4" /> },
          { path: '/tracking', label: 'Live Tracking', icon: <MapPin className="w-4 h-4" /> }
        ];
      case 'blood_bank':
        return [
          { path: '/blood-bank/dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
          { path: '/blood-bank/inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
          { path: '/tracking', label: 'Live Tracking', icon: <MapPin className="w-4 h-4" /> }
        ];
      case 'driver':
        return [
          { path: '/tracking', label: 'Live Tracking', icon: <MapPin className="w-4 h-4" /> }
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Admin Dashboard', icon: <User className="w-4 h-4" /> }
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RAKT-RADAR</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
              {getRoleIcon(user?.role)}
              <span className="text-sm font-medium text-gray-700">
                {getRoleName(user?.role)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Mobile User Info */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg mb-3">
                {getRoleIcon(user?.role)}
                <span className="text-sm font-medium text-gray-700">
                  {getRoleName(user?.role)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
