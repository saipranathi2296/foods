import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NgoSidebar from '../components/NgoSidebar';
import FoodRequests from '../components/FoodRequests';

const NgoDashboard = () => {
  const { user } = useContext(AuthContext);
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
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 2rem', gap: '2rem', minHeight: '80vh', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>NGO Dashboard</h1>
        <p style={{ color: 'var(--accent)' }}>View and claim available leftover food dynamically.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        <NgoSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="clay-panel" style={{ minHeight: '600px' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default NgoDashboard;
