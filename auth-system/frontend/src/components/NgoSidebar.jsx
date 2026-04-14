import React from 'react';

const NgoSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const tabs = [
    { id: 'food-requests', label: 'Available Food', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>NGO Portal</h2>
      </div>
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon}></path>
            </svg>
            <span>{tab.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
};

export default NgoSidebar;
