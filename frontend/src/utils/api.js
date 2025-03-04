import axios from 'axios';

// Create API client
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response, 
  error => {
    // Default error message
    let errorMessage = 'An unexpected error occurred';
    
    // No response from server
    if (!error.response) {
      errorMessage = 'Network error: Server is not responding';
      console.error(errorMessage, error);
      // Handle offline state or server down
    } 
    // Server responded with error status
    else {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'Invalid request';
          break;
        case 401:
          errorMessage = 'Authentication required';
          // Handle unauthorized - redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = 'The requested resource was not found';
          break;
        case 422:
          errorMessage = data.message || 'Validation failed';
          break;
        case 500:
          errorMessage = 'Server error: Please try again later';
          break;
        default:
          errorMessage = data.message || 'An error occurred';
      }
      
      console.error(`API Error (${status}):`, errorMessage, data);
    }
    
    // You can also dispatch to a global error state store here
    
    // Return a standardized error object
    return Promise.reject({
      message: errorMessage,
      originalError: error,
      response: error.response
    });
  }
);

export default api;