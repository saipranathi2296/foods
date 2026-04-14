import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { manualValidate, googleValidate, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'student') navigate('/student-dashboard');
      if (user.role === 'mess') navigate('/mess-dashboard');
      if (user.role === 'ngo') navigate('/ngo-dashboard');
    }
  }, [user, navigate, loading]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await manualValidate(formData.email);
      navigate('/complete-profile', { 
        state: { 
          authType: 'manual', 
          name: formData.name, 
          email: formData.email, 
          password: formData.password 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
        <h2>Create an Account</h2>
        <p className="auth-subtitle">Join us to get started</p>
        
        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4>Option 1: Sign up with Google</h4>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await googleValidate(credentialResponse.credential);
                navigate('/complete-profile', { 
                  state: { 
                    authType: 'google', 
                    googleToken: credentialResponse.credential 
                  } 
                });
              } catch (err) {
                setError(err.response?.data?.message || 'Google Signup validation failed.');
              }
            }}
            onError={() => {
              setError('Google Login Failed');
            }}
          />
        </div>

        <hr style={{ margin: '2rem 0' }} />
        <h4>Option 2: Signup Manually</h4>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              placeholder="John Doe" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              placeholder="you@example.com" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Validating...' : 'Next'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
