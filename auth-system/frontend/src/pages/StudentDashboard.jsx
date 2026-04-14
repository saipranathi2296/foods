import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StudentSidebar from '../components/StudentSidebar';
import DailyMenu from '../components/DailyMenu';
import SwapMarketplace from '../components/SwapMarketplace';
import PostItemForm from '../components/PostItemForm';
import MyListings from '../components/MyListings';
import MyRequests from '../components/MyRequests';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('menu');

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <DailyMenu />;
      case 'marketplace': return <SwapMarketplace />;
      case 'post-item': return <PostItemForm onPostSuccess={() => setActiveTab('my-listings')} />;
      case 'my-listings': return <MyListings />;
      case 'my-requests': return <MyRequests />;
      default: return <DailyMenu />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 2rem', gap: '2rem', minHeight: '80vh', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Student Portal</h1>
        <p style={{ color: 'var(--accent)' }}>Welcome back, {user.name}!</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="clay-panel" style={{ minHeight: '600px' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
