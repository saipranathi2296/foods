import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AddMenuForm from '../components/AddMenuForm';
import LeftoverFoodForm from '../components/LeftoverFoodForm';
import Analytics from '../components/Analytics';

const MessDashboard = () => {
  const { user } = useContext(AuthContext);
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
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 2rem', gap: '2rem', minHeight: '80vh', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Mess Operations</h1>
        <p style={{ color: 'var(--accent)' }}>Manage your daily menus and track leftovers.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="clay-panel" style={{ minHeight: '600px' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MessDashboard;
