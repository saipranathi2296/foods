import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/profile');
          setUser(data);
        } catch (error) {
          console.error('Failed to verify token:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const manualValidate = async (email) => {
    const { data } = await api.post('/auth/signup/validate', { email });
    return data;
  };

  const manualSignupFinal = async (userData) => {
    const { data } = await api.post('/auth/signup/final', userData);
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const manualSignupInitiate = async (userData) => {
    const { data } = await api.post('/auth/signup/initiate', userData);
    return data;
  };

  const manualSignupVerify = async (email, otp) => {
    const { data } = await api.post('/auth/signup/verify', { email, otp });
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const googleValidate = async (token) => {
    const { data } = await api.post('/auth/google/validate', { token });
    return data;
  };

  const googleLogin = async (token, role, phoneNumber, gender, hostelBlock) => {
    const { data } = await api.post('/auth/google', { token, role, phoneNumber, gender, hostelBlock });
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, manualValidate, manualSignupFinal, manualSignupInitiate, manualSignupVerify, googleValidate, googleLogin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
