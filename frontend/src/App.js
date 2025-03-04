// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ItemCard from './components/ItemCard';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ItemGrid from './components/ItemGrid';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import ProtectedRoute from './components/ProtectedRoute';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const items = [
    {
      id: 1,
      name: 'Classic T-Shirt',
      description: 'Comfortable cotton blend t-shirt',
      price: 19.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.5
    },
    {
      id: 2,
      name: 'Denim Jeans',
      description: 'Classic fit blue jeans',
      price: 49.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.0
    },
    {
      id: 3,
      name: 'Sneakers',
      description: 'Sports running shoes',
      price: 79.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.8
    },
    {
      id: 4,
      name: 'Hoodie',
      description: 'Warm winter hoodie',
      price: 39.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.2
    },
    {
      id: 5,
      name: 'Cap',
      description: 'Adjustable baseball cap',
      price: 24.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.1
    },
    {
      id: 6,
      name: 'Shorts',
      description: 'Casual summer shorts',
      price: 29.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.3
    },
    {
      id: 7,
      name: 'Socks',
      description: 'Cotton blend socks pack',
      price: 14.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.6
    },
    {
      id: 8,
      name: 'Jacket',
      description: 'Lightweight spring jacket',
      price: 89.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.7
    },
    {
      id: 9,
      name: 'Polo Shirt',
      description: 'Classic polo shirt',
      price: 34.99,
      image: 'https://via.placeholder.com/150',
      rating: 4.4
    }
  ];

  const [cartItems, setCartItems] = useState([]);

  const handleAddToCart = (item, selectedSize) => {
    if (selectedSize === 'Size') {
      alert('Please select a size');
      return;
    }
  
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => 
        i.id === item.id && i.size === selectedSize
      );
      
      if (existingItem) {
        return prevItems.map(i =>
          i.id === item.id && i.size === selectedSize
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prevItems, { ...item, size: selectedSize, quantity: 1 }];
    });
  };
  const handleUpdateQuantity = (itemId, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Navbar cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<ItemGrid items={items} onAddToCart={handleAddToCart} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route 
                path="/cart" 
                element={
                  <ProtectedRoute>
                    <Cart 
                      cartItems={cartItems}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                    />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <Checkout cartItems={cartItems} />
                  </ProtectedRoute>
                } 
              />

              {/* 404 route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;