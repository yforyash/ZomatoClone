import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [activeRestaurant, setActiveRestaurant] = useState(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('z_cart');
    const savedRes = localStorage.getItem('z_res');
    if (savedCart) setCartItems(JSON.parse(savedCart));
    if (savedRes) setActiveRestaurant(JSON.parse(savedRes));
  }, []);

  useEffect(() => {
    localStorage.setItem('z_cart', JSON.stringify(cartItems));
    if (activeRestaurant) localStorage.setItem('z_res', JSON.stringify(activeRestaurant));
    else localStorage.removeItem('z_res');
  }, [cartItems, activeRestaurant]);

  const addToCart = (item, restaurant) => {
    if (activeRestaurant && activeRestaurant.id !== restaurant.id) {
      if (window.confirm(`Your cart contains items from ${activeRestaurant.name}. Discard and order from ${restaurant.name}?`)) {
        setCartItems([{ ...item, qty: 1 }]);
        setActiveRestaurant(restaurant);
      }
      return;
    }
    if (!activeRestaurant) setActiveRestaurant(restaurant);
    setCartItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === itemId);
      if (!exists) return prev;
      let updated = exists.qty === 1 ? prev.filter(i => i.id !== itemId) : prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
      if (updated.length === 0) setActiveRestaurant(null);
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setActiveRestaurant(null);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cartItems, activeRestaurant, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
