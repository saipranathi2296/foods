import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

import Login from './pages/Login';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';
import MessDashboard from './pages/MessDashboard';
import StudentDashboard from './pages/StudentDashboard';
import NgoDashboard from './pages/NgoDashboard';

import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <div className="spinner"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Navigate to="/login" /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/complete-profile" element={<PageTransition><CompleteProfile /></PageTransition>} />
        <Route path="/student-dashboard" element={
          <PrivateRoute role="student">
            <PageTransition><StudentDashboard /></PageTransition>
          </PrivateRoute>
        } />
        <Route path="/mess-dashboard" element={
          <PrivateRoute role="mess">
            <PageTransition><MessDashboard /></PageTransition>
          </PrivateRoute>
        } />
        <Route path="/ngo-dashboard" element={
          <PrivateRoute role="ngo">
            <PageTransition><NgoDashboard /></PageTransition>
          </PrivateRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Background Decorative Elements */}
        <div className="pixel-bg"></div>
        <div className="clay-blob blob-1"></div>
        <div className="clay-blob blob-2"></div>

        <Navbar />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatedRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;