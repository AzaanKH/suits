import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const GlobalErrorHandler = () => {
  const [errors, setErrors] = useState([]);
  
  // Add error to the errors array
  const addError = (error) => {
    const id = Date.now();
    setErrors(prev => [...prev, { id, message: error.message }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeError(id);
    }, 5000);
  };
  
  // Remove error by id
  const removeError = (id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };
  
  // Register global error event listener
  useEffect(() => {
    const handleGlobalError = (event) => {
      addError({ message: event.reason?.message || 'An unexpected error occurred' });
    };
    
    window.addEventListener('unhandledrejection', handleGlobalError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);
  
  return (
    <ToastContainer position="top-end" className="p-3">
      {errors.map(error => (
        <Toast key={error.id} onClose={() => removeError(error.id)}>
          <Toast.Header>
            <strong className="me-auto">Error</strong>
          </Toast.Header>
          <Toast.Body>{error.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default GlobalErrorHandler;