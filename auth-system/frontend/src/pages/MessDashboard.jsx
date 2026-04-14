import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AddMenuForm from '../components/AddMenuForm';
import LeftoverFoodForm from '../components/LeftoverFoodForm';
import Analytics from '../components/Analytics';
import '../styles/MessDashboard.css';
import '../styles/MenuForm.css';

const MessDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('menu');

  if (!user || user.role !== 'mess') {
    return <Navigate to="/login" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AddMenuForm />;
      case 'leftovers': return <LeftoverFoodForm />;
      case 'analytics': return <Analytics />;
      default: return <AddMenuForm />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Mess Staff Dashboard</h1>
          <p>Welcome back, {user.name}. Manage daily menus and leftover food below.</p>
        </div>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default MessDashboard;
