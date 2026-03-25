import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      
      if (authToken) {
        setToken(authToken);
        const response = await authAPI.getCurrentUser();
        const loadedUser = response.data.data.user;
        if (loadedUser.emailVerified) {
          setUser(loadedUser);
        } else {
          await SecureStore.deleteItemAsync('authToken');
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error.response?.status, error.response?.data?.message || error.message);
      
      // Clear token on auth errors (400+)
      if (error.response?.status >= 400) {
        await SecureStore.deleteItemAsync('authToken');
        setToken(null);
        console.log('🧹 Cleared invalid token');
      }
      
    } finally {
      setLoading(false);
    }
  };


  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, user: userData } = response.data.data;
      
      await SecureStore.setItemAsync('authToken', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.status, error.response?.data || error.message);
      let errorMsg;
      if (!error.response) {
        errorMsg = 'Network error - Backend not accessible';
      } else if (error.response.status === 401) {
        if (error.response.data?.message?.includes('verify your email') || error.response.data?.message?.includes('OTP')) {
          return { success: false, message: error.response.data.message, type: 'otp_verification' };
        }
        errorMsg = error.response.data?.message || 'Invalid credentials';
      } else if (error.response.status === 500) {
        errorMsg = 'Server error - Please try again';
      } else {
        errorMsg = error.response.data?.message || 'Login failed';
      }
      return { success: false, message: errorMsg };
    }
  };


  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { 
        success: true, 
        message: response.data.message,
        email: response.data.data?.email
      };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMsg;
      if (!error.response) {
        errorMsg = 'Network error - Backend not accessible';
      } else {
        errorMsg = error.response.data?.message || 'Registration failed';
      }
      return { success: false, message: errorMsg };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await authAPI.verifyOTP(email, otp);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'OTP verification failed' 
      };
    }
  };

  const resendOTP = async (email) => {
    try {
      const response = await authAPI.resendOTP(email);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to resend OTP' 
      };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const refreshUser = () => {
    loadUser();
  };

  const checkUsername = async (username) => {
    try {
      const response = await authAPI.checkUsername(username);
      return response.data;
    } catch (error) {
      return {
        success: false,
        available: false,
        message: error.response?.data?.message || 'Check failed'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyOTP,
    resendOTP,
    checkUsername,
    logout,
    updateUserProfile,
    refreshUser,
    isAuthenticated: !!user?.emailVerified,
    pushToken: user?.pushToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

