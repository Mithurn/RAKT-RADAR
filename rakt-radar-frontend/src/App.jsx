import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard';
import BloodManagement from './components/BloodManagement';
import SmartRouting from './components/SmartRouting';
import UnifiedTracking from './components/UnifiedTracking';
import TrackingDashboard from './components/TrackingDashboard';
import Navigation from './components/Navigation';
import BloodBankDashboard from './components/BloodBank/BloodBankDashboard';
import DriverRoutes from './components/Driver/DriverRoutes';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userData, entityDetails) => {
    console.log('Login success callback:', userData, entityDetails); // Debug log
    
    // Update state first
    setUser(userData);
    setIsAuthenticated(true);
    
    // Force a re-render by updating localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('entity_details', JSON.stringify(entityDetails));
    
    console.log('Authentication state updated:', { user: userData, isAuthenticated: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('entity_details');
    localStorage.removeItem('session_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    console.log('ProtectedRoute check:', { isAuthenticated, user, allowedRoles }); // Debug log
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login'); // Debug log
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      console.log('Role not allowed:', { userRole: user?.role, allowedRoles }); // Debug log
      return <Navigate to="/unauthorized" replace />;
    }

    console.log('Access granted to protected route'); // Debug log
    return children;
  };

  // Unauthorized component
  const Unauthorized = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navigation user={user} onLogout={handleLogout} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          
          {/* Role-based root route */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                {user?.role === 'hospital' && <Dashboard />}
                {user?.role === 'blood_bank' && <Navigate to="/blood-bank/dashboard" replace />}
                {user?.role === 'driver' && <Navigate to="/driver/routes" replace />}
                {user?.role === 'admin' && <Navigate to="/admin" replace />}
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Hospital-specific routes */}
          <Route 
            path="/hospital" 
            element={
              <ProtectedRoute allowedRoles={['hospital', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blood-management" 
            element={
              <ProtectedRoute allowedRoles={['hospital', 'admin']}>
                <BloodManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/smart-routing" 
            element={
              <ProtectedRoute allowedRoles={['hospital', 'admin']}>
                <SmartRouting />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tracking" 
            element={
              <ProtectedRoute allowedRoles={['hospital', 'blood_bank', 'driver', 'admin']}>
                <UnifiedTracking />
              </ProtectedRoute>
            } 
          />

          {/* Blood Bank routes */}
          <Route 
            path="/blood-bank/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['blood_bank', 'admin']}>
                <BloodBankDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blood-bank/inventory" 
            element={
              <ProtectedRoute allowedRoles={['blood_bank', 'admin']}>
                <BloodManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blood-bank/tracking/:requestId" 
            element={
              <ProtectedRoute allowedRoles={['blood_bank', 'admin']}>
                <UnifiedTracking />
              </ProtectedRoute>
            } 
          />

          {/* Driver routes */}
          <Route 
            path="/driver/routes" 
            element={
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <DriverRoutes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/driver/tracking/:requestId" 
            element={
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <UnifiedTracking />
              </ProtectedRoute>
            } 
          />

          {/* Admin routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div className="min-h-screen bg-gray-50 p-6">
                  <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
                    <p className="text-gray-600">Admin functionality coming soon...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />

          {/* Role-based dashboard route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {user?.role === 'hospital' && <Navigate to="/" replace />}
                {user?.role === 'blood_bank' && <Navigate to="/blood-bank/dashboard" replace />}
                {user?.role === 'driver' && <Navigate to="/driver/routes" replace />}
                {user?.role === 'admin' && <Navigate to="/admin" replace />}
                <Navigate to="/" replace />
              </ProtectedRoute>
            } 
          />

          {/* Unauthorized route */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Catch all - redirect to appropriate dashboard based on role */}
          <Route 
            path="*" 
            element={
              <ProtectedRoute>
                {user?.role === 'hospital' && <Navigate to="/" replace />}
                {user?.role === 'blood_bank' && <Navigate to="/blood-bank/dashboard" replace />}
                {user?.role === 'driver' && <Navigate to="/driver/routes" replace />}
                {user?.role === 'admin' && <Navigate to="/admin" replace />}
                <Navigate to="/" replace />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
