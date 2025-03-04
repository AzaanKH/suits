import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const registerUser = (data) =>
  axios.post(`${API_BASE_URL}/register`, data);

export const loginUser = (data) =>
  axios.post(`${API_BASE_URL}/login`, data);

export const getCart = (token) =>
  axios.get(`${API_BASE_URL}/cart`, {
    headers: { Authorization: `Bearer ${token}` }
  });