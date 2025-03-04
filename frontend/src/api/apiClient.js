import axios from 'axios';

// Create a base API client with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Optional: redirect to login page
      window.location.href = '/login';
    }
    
    // Handle server errors
    if (!error.response) {
      console.error('Network error: API server is not responding');
      // You can dispatch to a global error state if using Redux/Context
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;