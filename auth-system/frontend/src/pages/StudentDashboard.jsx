import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StudentSidebar from '../components/StudentSidebar';
import DailyMenu from '../components/DailyMenu';
import SwapMarketplace from '../components/SwapMarketplace';
import PostItemForm from '../components/PostItemForm';
import MyListings from '../components/MyListings';
import MyRequests from '../components/MyRequests';
import '../styles/MessDashboard.css'; // Reusing dashboard layout wrapper

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
    <div className="dashboard-layout">
      <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <p>Welcome back, {user.name}. Here is what's happening today.</p>
        </div>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default StudentDashboard;
