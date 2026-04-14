import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Flame, LogOut, LayoutDashboard, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show full navbar on auth pages if not logged in
  if (!user && (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/complete-profile' || location.pathname === '/')) {
    return (
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
          <Flame size={28} />
          <h2 style={{ margin: 0, fontWeight: 800, letterSpacing: '1px' }}>FoodShare</h2>
        </div>
      </nav>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        margin: '1rem 2rem',
        background: 'var(--clay-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-clay)',
        position: 'sticky',
        top: '1rem',
        zIndex: 50
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
        <div style={{
          background: 'var(--grad-primary)',
          padding: '0.5rem',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 4px 10px rgba(6,182,212,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Flame size={24} color="#081b22" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>FoodShare</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)' }}>
              <User size={16} color="var(--accent)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
              <span className="badge badge-aqua" style={{ marginLeft: '0.5rem' }}>{user.role}</span>
            </div>
            
            <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem' }}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
