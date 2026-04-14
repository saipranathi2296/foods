import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserCircle, User, Home, ShieldCheck } from 'lucide-react';

const CompleteProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { manualSignupInitiate, manualSignupVerify, googleLogin, user, loading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    role: 'student',
    gender: 'male',
    hostelBlock: ''
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [devWarning, setDevWarning] = useState('');

  // Re-direct securely if accessed natively
  useEffect(() => {
    if (!location.state) {
      navigate('/signup');
    }
  }, [location, navigate]);

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
    if (!formData.role) {
      setError('All required fields must be filled');
      return;
    }
    if (formData.role === 'student' && (!formData.gender || !formData.hostelBlock)) {
      setError('All required fields must be filled');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    try {
      if (location.state.authType === 'google') {
        const { googleToken } = location.state;
        await googleLogin(googleToken, formData.role, undefined, formData.gender, formData.hostelBlock);
      } else {
        const { name, email, password } = location.state;
        const responseData = await manualSignupInitiate({
          name, email, password,
          role: formData.role,
          gender: formData.gender,
          hostelBlock: formData.hostelBlock
        });
        
        if (responseData && responseData.devOtp) {
          setDevWarning(`SMTP Server Offline! Developer Testing OTP is: ${responseData.devOtp}`);
        }
        
        setShowOtp(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { email } = location.state;
      await manualSignupVerify(email, otp);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location.state || loading) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
      <div className="clay-card" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', padding: '1rem', borderRadius: '50%', 
            background: 'var(--grad-orange)', marginBottom: '1rem',
            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)'
          }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Complete Profile</h2>
          <p>Almost there! Tell us a bit more.</p>
        </div>
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        {showOtp ? (
          <form onSubmit={handleOtpSubmit}>
            {devWarning && (
              <div className="alert alert-warn" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong>Test Mode</strong>
                <span style={{ fontSize: '0.85rem' }}>{devWarning}</span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter 6-Digit OTP</label>
              <input 
                type="text" 
                id="otp" 
                className="form-input"
                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="------" 
                maxLength={6}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
              {isSubmitting ? <span className="spinner"></span> : 'Verify OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role / Panel</label>
              <div style={{ position: 'relative' }}>
                <UserCircle size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select id="role" name="role" className="form-select" style={{ paddingLeft: '2.75rem' }} value={formData.role} onChange={handleChange} required>
                  <option value="student">Student</option>
                  <option value="mess">Mess Staff</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
            </div>

            {formData.role === 'student' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="gender">Gender</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select id="gender" name="gender" className="form-select" style={{ paddingLeft: '2.75rem' }} value={formData.gender} onChange={handleChange}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
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
                      value={formData.hostelBlock} 
                      onChange={handleChange} 
                      placeholder="Block A" 
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
              {isSubmitting ? <span className="spinner"></span> : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompleteProfile;
