import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('skyvent_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('skyvent_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('skyvent_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Could not fetch user session:', err);
      // If token expired, clear
      if (err.status === 401) {
        localStorage.removeItem('skyvent_access_token');
        localStorage.removeItem('skyvent_refresh_token');
        localStorage.removeItem('skyvent_user');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleSync = () => {
      if (localStorage.getItem('skyvent_access_token')) {
        fetchCurrentUser();
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data) {
      const { tokens, user: userData } = res.data;
      localStorage.setItem('skyvent_access_token', tokens.access);
      localStorage.setItem('skyvent_refresh_token', tokens.refresh);
      localStorage.setItem('skyvent_user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Welcome, ${userData.name}!`);
      return userData;
    }
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    toast.success(res.message || 'Registration successful! Verification code sent to email.');
    return res.data;
  };

  const sendOtp = async (email, purpose = 'REGISTER') => {
    const res = await authService.sendOtp(email, purpose);
    toast.success(res.message || 'Verification code sent to your email.');
    return res.data;
  };

  const verifyOtp = async (email, otp, purpose = 'REGISTER') => {
    const res = await authService.verifyOtp(email, otp, purpose);
    if (res.data?.tokens && res.data?.user) {
      const { tokens, user: userData } = res.data;
      localStorage.setItem('skyvent_access_token', tokens.access);
      localStorage.setItem('skyvent_refresh_token', tokens.refresh);
      localStorage.setItem('skyvent_user', JSON.stringify(userData));
      setUser(userData);
    }
    toast.success(res.message || 'Email verified successfully!');
    return res.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('skyvent_access_token');
      localStorage.removeItem('skyvent_refresh_token');
      localStorage.removeItem('skyvent_user');
      setUser(null);
      toast.info('You have logged out.');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('skyvent_user', JSON.stringify(res.data));
      }
    } catch (e) {
      console.warn('Failed to refresh user:', e);
    }
  };

  const updateProfile = async (data) => {
    const res = await authService.updateProfile(data);
    if (res.data) {
      setUser(res.data);
      localStorage.setItem('skyvent_user', JSON.stringify(res.data));
      toast.success('Profile updated successfully.');
    }
    return res.data;
  };

  const isStaff = user && ['SUPER_ADMIN', 'MERCHANDISE', 'TREASURER', 'VOLUNTEER'].includes(user.role);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isMerchandise = user?.role === 'MERCHANDISE' || isSuperAdmin;
  const isTreasurer = user?.role === 'TREASURER' || isSuperAdmin;
  const isVolunteer = user?.role === 'VOLUNTEER' || isSuperAdmin;
  const isPresident = isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
        refreshUser,
        updateProfile,
        isStaff,
        isSuperAdmin,
        isMerchandise,
        isTreasurer,
        isVolunteer,
        isPresident,
      }}
    >
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
