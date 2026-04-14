import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Signup.css';

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
    <div className="auth-container">
      <div className="auth-card signup-card">
        <h2>Complete Profile</h2>
        <p className="auth-subtitle">Almost there! We just need a few more details.</p>
        
        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        {showOtp ? (
          <form onSubmit={handleOtpSubmit}>
            {devWarning && (
              <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ffeeba' }}>
                <strong>Test Mode:</strong> {devWarning}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="otp">Enter OTP Sent to Email</label>
              <input 
                type="text" 
                id="otp" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="6-digit OTP" 
                required 
              />
            </div>
            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="role">Role / Panel *</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} required>
                <option value="student">Student</option>
                <option value="mess">Mess Staff</option>
                <option value="ngo">NGO</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <div className="row">
                <div className="col form-group">
                  <label htmlFor="gender">Gender (optional)</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col form-group">
                  <label htmlFor="hostelBlock">Hostel Block *</label>
                  <input 
                    type="text" 
                    id="hostelBlock" 
                    name="hostelBlock"
                    value={formData.hostelBlock} 
                    onChange={handleChange} 
                    placeholder="e.g., Block A" 
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompleteProfile;
