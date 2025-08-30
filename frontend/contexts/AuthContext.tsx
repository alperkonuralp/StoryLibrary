'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    
    if (savedToken) {
      setToken(savedToken);
      apiClient.setAuthToken(savedToken);
      
      // Verify token by getting user info
      apiClient.getMe()
        .then(response => {
          if (response.success) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            apiClient.clearAuthToken();
            setToken(null);
          }
        })
        .catch((error) => {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          apiClient.clearAuthToken();
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        
        // Save to localStorage
        localStorage.setItem('authToken', newToken);
        
        // Set token in API client
        apiClient.setAuthToken(newToken);
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, username?: string) => {
    try {
      const response = await apiClient.register(email, password, username);
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        
        // Save to localStorage
        localStorage.setItem('authToken', newToken);
        
        // Set token in API client
        apiClient.setAuthToken(newToken);
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Clear from localStorage
    localStorage.removeItem('authToken');
    
    // Clear from API client
    apiClient.clearAuthToken();
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}