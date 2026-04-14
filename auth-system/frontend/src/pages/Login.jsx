import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);
  const [extraDetails, setExtraDetails] = useState({
    role: 'student',
    phoneNumber: '',
    gender: 'male',
    hostelBlock: ''
  });

  const { login, googleLogin, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'student') navigate('/student-dashboard');
      if (user.role === 'mess') navigate('/mess-dashboard');
      if (user.role === 'ngo') navigate('/ngo-dashboard');
    }
  }, [user, navigate, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtraDetailsChange = (e) => {
    setExtraDetails({ ...extraDetails, [e.target.name]: e.target.value });
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await googleLogin(pendingGoogleToken, extraDetails.role, extraDetails.phoneNumber, extraDetails.gender, extraDetails.hostelBlock);
    } catch (err) {
      setError(err.response?.data?.message || 'Google Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to Access Dashboard</h2>
        <p className="auth-subtitle">Sign in with your registered email</p>
        
        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        {pendingGoogleToken ? (
          <form onSubmit={handleCompleteRegistration}>
            <div className="form-group">
              <label htmlFor="role">Role / Panel</label>
              <select id="role" name="role" value={extraDetails.role} onChange={handleExtraDetailsChange}>
                <option value="student">Student</option>
                <option value="mess">Mess Staff</option>
                <option value="ngo">NGO</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={extraDetails.phoneNumber}
                onChange={handleExtraDetailsChange}
                placeholder="Your Phone Number"
                required
              />
            </div>

            {extraDetails.role === 'student' && (
              <div className="row">
                <div className="col form-group">
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" name="gender" value={extraDetails.gender} onChange={handleExtraDetailsChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col form-group">
                  <label htmlFor="hostelBlock">Hostel Block</label>
                  <input
                    type="text"
                    id="hostelBlock"
                    name="hostelBlock"
                    value={extraDetails.hostelBlock}
                    onChange={handleExtraDetailsChange}
                    placeholder="e.g., Block A"
                  />
                </div>
              </div>
            )}

            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? 'Completing...' : 'Complete Registration'}
            </button>
            <button 
              type="button" 
              className="auth-button" 
              style={{marginTop: '0.5rem', background: '#ccc', color: '#333'}} 
              onClick={() => setPendingGoogleToken(null)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="auth-button" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        )}

        {!pendingGoogleToken && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  await googleLogin(credentialResponse.credential);
                } catch (err) {
                  if (err.response?.data?.requirePhone) {
                    setPendingGoogleToken(credentialResponse.credential);
                    setError(''); // clear any possible error, they just need to complete registration
                  } else {
                    setError(err.response?.data?.message || 'Google Login failed.');
                  }
                }
              }}
              onError={() => {
                setError('Google Login Failed');
              }}
            />
          </div>
        )}

        {!pendingGoogleToken && (
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
