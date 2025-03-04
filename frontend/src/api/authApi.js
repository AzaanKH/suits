import apiClient from './apiClient';

export const register = (userData) => {
  return apiClient.post('/auth/register', userData);
};

export const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

export const getCurrentUser = () => {
  return apiClient.get('/auth/me');
};

// src/api/productsApi.js
import apiClient from './apiClient';

export const getProducts = (page = 0, limit = 10) => {
  return apiClient.get(`/products?page=${page}&limit=${limit}`);
};

export const getProduct = (productId) => {
  return apiClient.get(`/products/${productId}`);
};