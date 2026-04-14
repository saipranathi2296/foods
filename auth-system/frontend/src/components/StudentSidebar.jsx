import React from 'react';

const StudentSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const tabs = [
    { id: 'menu', label: 'Daily Menu', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: 'marketplace', label: 'Swap & Share', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { id: 'post-item', label: 'Post an Item', icon: 'M12 4v16m8-8H4' },
    { id: 'my-listings', label: 'My Listings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'my-requests', label: 'My Requests', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Student Portal</h2>
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

export default StudentSidebar;
