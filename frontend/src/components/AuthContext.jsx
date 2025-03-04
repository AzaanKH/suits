import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create a context
const AuthContext = createContext();

// Create a custom hook for using the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Create the auth provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Base API URL 
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => {
    // Check if user is already logged in (token exists)
    const token = localStorage.getItem('token');
    
    if (token) {
      // Get current user data
      axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(err => {
          console.error('Failed to get user data:', err);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // Create the value object for the context
  const value = {
    currentUser,
    login,
    register,
    logout,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}