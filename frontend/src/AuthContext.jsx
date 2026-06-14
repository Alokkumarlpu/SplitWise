import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const response = await api.get('/api/users/me/');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          // api.js response interceptor handles token refresh.
          // If it lands here, both tokens have expired/failed.
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login/', { username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Fetch user profile info
      const meResponse = await api.get('/api/users/me/');
      setUser(meResponse.data);
      localStorage.setItem('user', JSON.stringify(meResponse.data));
      setLoading(false);
      return meResponse.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      await api.post('/api/auth/register/', { username, email, password });
      setLoading(false);
      // Auto login after registration
      return await login(username, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
