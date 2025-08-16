import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BloodManagement from './components/BloodManagement';
import SmartRouting from './components/SmartRouting';
import EnhancedMapTracking from './components/SimpleMapTracking';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blood-management" element={<BloodManagement />} />
          <Route path="/smart-routing" element={<SmartRouting />} />
          <Route path="/tracking" element={<EnhancedMapTracking />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
