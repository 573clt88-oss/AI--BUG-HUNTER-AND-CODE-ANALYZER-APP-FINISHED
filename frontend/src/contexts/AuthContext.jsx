import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock authentication for now - will replace with Firebase
  const mockUsers = [
    {
      id: 'user_1',
      email: 'demo@example.com',
      displayName: 'Demo User',
      subscription: {
        tier: 'free',
        status: 'trialing',
        usage: { used: 3, limit: 10 },
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    },
    {
      id: 'admin_1',
      email: 'admin@example.com', 
      displayName: 'Admin User',
      isAdmin: true,
      subscription: {
        tier: 'pro',
        status: 'active',
        usage: { used: 150, limit: -1 }
      }
    }
  ];

  useEffect(() => {
    // Check for stored auth state
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Mock login - replace with Firebase authentication
      const mockUser = mockUsers.find(u => u.email === email);
      if (!mockUser) {
        throw new Error('Invalid email or password');
      }

      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, displayName) => {
    try {
      // Mock registration - replace with Firebase
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        displayName,
        subscription: {
          tier: 'free',
          status: 'trialing', 
          usage: { used: 0, limit: 10 },
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      };

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_user');
  };

  const updateUserSubscription = (subscriptionData) => {
    if (user) {
      const updatedUser = {
        ...user,
        subscription: { ...user.subscription, ...subscriptionData }
      };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUserSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;