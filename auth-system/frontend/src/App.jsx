import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';
import MessDashboard from './pages/MessDashboard';
import StudentDashboard from './pages/StudentDashboard';
import NgoDashboard from './pages/NgoDashboard';

const DashboardLayout = ({ title, role }) => {
  const { user, logout } = useContext(AuthContext);
  
  if (!user || user.role !== role) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{title}</h1>
        <button 
          onClick={logout}
          style={{ padding: '0.5rem 1rem', background: 'var(--danger)', color: 'white', borderRadius: '8px' }}
        >
          Logout
        </button>
      </header>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2>Welcome, {user.name}!</h2>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
          Email: {user.email}<br />
          Role: {user.role}
        </p>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/student-dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
          <Route path="/mess-dashboard" element={<PrivateRoute role="mess"><MessDashboard /></PrivateRoute>} />
          <Route path="/ngo-dashboard" element={<PrivateRoute role="ngo"><NgoDashboard /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;