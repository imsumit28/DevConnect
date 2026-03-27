import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUserData = (data = {}) => {
    const normalizedId = data._id || data.id || '';
    return {
      ...data,
      _id: normalizedId,
      id: normalizedId,
    };
  };

  const hydrateCurrentUserProfile = useCallback(async (fallbackUser = null) => {
    try {
      const response = await api.get('/users/me/profile');
      const hydratedUser = normalizeUserData(response.data);
      localStorage.setItem('user', JSON.stringify(hydratedUser));
      setUser(hydratedUser);
      return hydratedUser;
    } catch {
      if (fallbackUser) {
        const normalizedFallback = normalizeUserData(fallbackUser);
        localStorage.setItem('user', JSON.stringify(normalizedFallback));
        setUser(normalizedFallback);
        return normalizedFallback;
      }
      return null;
    }
  }, []);

  const setAuthSession = (authData) => {
    const { token, ...userData } = authData;
    const normalizedUser = normalizeUserData(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    // Hydrate with full server profile so followers/following stay accurate across sessions.
    hydrateCurrentUserProfile(normalizedUser);
    return normalizedUser;
  };

  useEffect(() => {
    // Check if user is logged in
    const checkUserLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          const normalizedUser = normalizeUserData(parsedUser);
          setUser(normalizedUser);
          // Do not block initial render on this request; avoids white-screen if API is slow/unreachable.
          hydrateCurrentUserProfile(normalizedUser);
        }
      } catch (error) {
        console.error('Auth verification failed', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, [hydrateCurrentUserProfile]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return setAuthSession(response.data);
  };

  const register = async (name, username, email, password) => {
    const response = await api.post('/auth/register', { name, username, email, password });
    return setAuthSession(response.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Update user data in both state and localStorage without reload
  const updateUser = (updatedData) => {
    const newUser = normalizeUserData({ ...user, ...updatedData });
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, updateUser, setAuthSession }}>
      {loading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-3 text-primary font-semibold">
            <span className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></span>
            Loading DevConnect...
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
