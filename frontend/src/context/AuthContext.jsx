/**
 * context/AuthContext.jsx
 * ========================
 * React Context for authentication state management.
 * Provides login, logout, register functions and user state to all components.
 *
 * Token storage strategy:
 * - We store JWT tokens in localStorage for simplicity
 * - Trade-off: Vulnerable to XSS attacks but simpler than httpOnly cookies
 * - For production: Consider httpOnly cookies with CSRF protection
 * - We never store passwords in any browser storage
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

// Create the context object
const AuthContext = createContext(null);

// Custom hook to use auth context (avoids importing useContext everywhere)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True during initial auth check

  /**
   * On app startup, check if tokens exist in localStorage.
   * If they do, fetch the user profile to validate they're still valid.
   */
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const response = await authService.getProfile();
          setUser(response.data);
        } catch (error) {
          // Token is invalid or expired - clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    const { access, refresh, user: userData } = response.data;

    // Store tokens in localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(userData);

    return response;
  }, []);

  const register = useCallback(async (userData) => {
    const response = await authService.register(userData);
    const { tokens, user: newUser } = response.data;

    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    setUser(newUser);

    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      // Even if logout API fails, clear local state
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      toast.success('Logged out successfully');
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
