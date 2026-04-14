import React from 'react';
import { ClipboardList, Utensils, BarChart3, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'menu', label: 'Menu Management', icon: ClipboardList },
    { id: 'leftovers', label: 'Leftover Food', icon: Utensils },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <aside className="clay-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'sticky', top: '7rem' }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Navigation</h3>
      
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'var(--grad-primary)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-primary)',
              boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.2s',
              textAlign: 'left',
              width: '100%',
              border: isActive ? 'none' : '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              if(!isActive) {
                e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                e.currentTarget.style.borderColor = 'var(--clay-border-2)';
              }
            }}
            onMouseLeave={(e) => {
              if(!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon size={20} />
              <span style={{ fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
            </div>
            {isActive && (
              <motion.div layoutId="active-indicator">
                <ChevronRight size={18} />
              </motion.div>
            )}
          </button>
        );
      })}
    </aside>
  );
};

export default Sidebar;
