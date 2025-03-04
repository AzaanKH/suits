import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create context
const CartContext = createContext();

// Custom hook to use the cart context
export function useCart() {
  return useContext(CartContext);
}

// Initial state
const initialState = {
  items: [],
  loading: false,
  error: null
};

// Reducer function to handle cart state updates
function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: null
      };
    case 'ADD_ITEM_SUCCESS':
      return {
        ...state,
        items: [...state.items, action.payload],
        loading: false,
        error: null
      };
    case 'UPDATE_ITEM_SUCCESS':
      return {
        ...state,
        items: state.items.map(item => 
          item.product_id === action.payload.product_id 
            ? { ...item, quantity: action.payload.quantity } 
            : item
        ),
        loading: false,
        error: null
      };
    case 'REMOVE_ITEM_SUCCESS':
      return {
        ...state,
        items: state.items.filter(item => item.product_id !== action.payload),
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
}

// Provider component
export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Base API URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

  // Load cart items when user logs in
  useEffect(() => {
    if (currentUser) {
      dispatch({ type: 'SET_LOADING' });
      
      const token = localStorage.getItem('token');
      
      axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          dispatch({ type: 'SET_CART', payload: response.data.cart });
        })
        .catch(error => {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: error.response?.data?.error || 'Failed to load cart' 
          });
        });
    } else {
      // Clear cart when user logs out
      dispatch({ type: 'SET_CART', payload: [] });
    }
  }, [currentUser, API_BASE_URL]);

  // Add item to cart
  const addItem = async (productId, quantity, size) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/cart`,
        {
          product_id: productId,
          quantity,
          size
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      dispatch({ type: 'ADD_ITEM_SUCCESS', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.error || 'Failed to add item' 
      });
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_BASE_URL}/cart/${productId}`,
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      dispatch({ 
        type: 'UPDATE_ITEM_SUCCESS', 
        payload: { product_id: productId, quantity } 
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.error || 'Failed to update item' 
      });
      throw error;
    }
  };

  // Remove item from cart
  const removeItem = async (productId) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE_URL}/cart/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      dispatch({ type: 'REMOVE_ITEM_SUCCESS', payload: productId });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.error || 'Failed to remove item' 
      });
      throw error;
    }
  };

  // Context value
  const value = {
    state,
    dispatch,
    addItem,
    updateQuantity,
    removeItem
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
