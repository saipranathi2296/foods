import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NgoSidebar from '../components/NgoSidebar';
import FoodRequests from '../components/FoodRequests';
import '../styles/MessDashboard.css'; // Reusing dashboard layout wrapper

const NgoDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('food-requests');

  if (!user || user.role !== 'ngo') {
    return <Navigate to="/login" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'food-requests': return <FoodRequests />;
      default: return <FoodRequests />;
    }
  };

  return (
    <div className="dashboard-layout">
      <NgoSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>NGO Dashboard</h1>
          <p>Welcome back, {user.name}. View and claim available leftover food.</p>
        </div>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default NgoDashboard;
