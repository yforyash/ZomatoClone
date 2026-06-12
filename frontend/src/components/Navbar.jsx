import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { UtensilsCrossed, Home as HomeIcon, TrendingUp, ShoppingCart, LogIn, LogOut } from 'lucide-react';

export function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('z_user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <UtensilsCrossed size={28} style={{ color: '#e23744' }} /> zomato
      </Link>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}><HomeIcon size={18} /> Home</Link>
        <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}><TrendingUp size={18} /> Analytics</Link>
        <Link to="/checkout" className={`nav-link ${location.pathname === '/checkout' ? 'active' : ''}`}><ShoppingCart size={18} /> Cart {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}</Link>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hi, <strong>{user.name.split(' ')[0]}</strong></span>
            <button className="filter-btn" onClick={handleLogout} style={{ border: 'none', background: 'rgba(209, 18, 67, 0.15)', color: 'var(--nonveg-color)' }}><LogOut size={16} /> Logout</button>
          </div>
        ) : (
          <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}><LogIn size={18} /> Login</Link>
        )}
      </div>
    </nav>
  );
}
