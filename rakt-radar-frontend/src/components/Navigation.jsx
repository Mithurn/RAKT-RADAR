import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Droplet, Route, Activity, MapPin } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Hospital Dashboard', icon: Home },
    { path: '/blood-management', label: 'Our Blood Bank', icon: Droplet },
    { path: '/smart-routing', label: 'Emergency Requests', icon: Route },
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900">RAKT-RADAR</span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-100 text-red-700 border-b-2 border-red-600'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Local Network Active</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
