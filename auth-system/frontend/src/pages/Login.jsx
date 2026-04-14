import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, LogIn, ArrowRight, Phone, Home, UserCircle } from 'lucide-react';

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
      <div className="clay-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', padding: '1rem', borderRadius: '50%', 
            background: 'var(--grad-primary)', marginBottom: '1rem',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)'
          }}>
            <LogIn size={32} color="#ffffff" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        {pendingGoogleToken ? (
          <form onSubmit={handleCompleteRegistration}>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role / Panel</label>
              <div style={{ position: 'relative' }}>
                <UserCircle size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select id="role" name="role" className="form-select" style={{ paddingLeft: '2.75rem' }} value={extraDetails.role} onChange={handleExtraDetailsChange}>
                  <option value="student">Student</option>
                  <option value="mess">Mess Staff</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  value={extraDetails.phoneNumber}
                  onChange={handleExtraDetailsChange}
                  placeholder="+1 234 567 890"
                  required
                />
              </div>
            </div>

            {extraDetails.role === 'student' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="gender">Gender</label>
                  <select id="gender" name="gender" className="form-select" value={extraDetails.gender} onChange={handleExtraDetailsChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="hostelBlock">Hostel Block</label>
                  <div style={{ position: 'relative' }}>
                    <Home size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      id="hostelBlock"
                      name="hostelBlock"
                      className="form-input"
                      style={{ paddingLeft: '2.75rem' }}
                      value={extraDetails.hostelBlock}
                      onChange={handleExtraDetailsChange}
                      placeholder="e.g., Block A"
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
              {isSubmitting ? <><span className="spinner"></span> Completing...</> : 'Complete Registration'}
            </button>
            <button 
              type="button" 
              className="btn btn-ghost btn-full" 
              style={{marginTop: '0.5rem'}} 
              onClick={() => setPendingGoogleToken(null)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
                {isSubmitting ? <span className="spinner"></span> : 'Sign In'}
              </button>
            </form>
          </>
        )}

        {!pendingGoogleToken && (
          <div style={{ marginTop: '2rem' }}>
            <div className="divider">Or continue with</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    await googleLogin(credentialResponse.credential);
                  } catch (err) {
                    if (err.response?.data?.requirePhone) {
                      setPendingGoogleToken(credentialResponse.credential);
                      setError('');
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
          </div>
        )}

        {!pendingGoogleToken && (
          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/signup" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Sign up <ArrowRight size={14} /></Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
