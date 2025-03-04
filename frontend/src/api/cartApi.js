import apiClient from './apiClient';

export const getCart = () => {
  return apiClient.get('/cart');
};

export const addToCart = (productData) => {
  return apiClient.post('/cart', productData);
};

export const updateCartItem = (productId, quantity) => {
  return apiClient.put(`/cart/${productId}`, { quantity });
};

export const removeFromCart = (productId) => {
  return apiClient.delete(`/cart/${productId}`);
};