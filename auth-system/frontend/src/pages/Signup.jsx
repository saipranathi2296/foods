import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { UserPlus, User, Mail, Lock, ArrowRight } from 'lucide-react';

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
      <div className="clay-card" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', padding: '1rem', borderRadius: '50%', 
            background: 'var(--grad-green)', marginBottom: '1rem',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)'
          }}>
            <UserPlus size={32} color="#ffffff" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Create Account</h2>
          <p>Join the FoodShare community</p>
        </div>
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <GoogleLogin
            shape="pill"
            theme="filled_black"
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

        <div className="divider">Or register manually</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                id="name" 
                name="name"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.name} 
                onChange={handleChange} 
                placeholder="John Doe" 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                id="email" 
                name="email"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.email} 
                onChange={handleChange} 
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
                name="password"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
            {isSubmitting ? <span className="spinner"></span> : <>Next Step <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Sign in <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
