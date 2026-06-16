import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { UtensilsCrossed, Home as HomeIcon, TrendingUp, ShoppingCart, LogIn, LogOut, ShieldAlert, Store, Wallet } from 'lucide-react';
import _ from 'lodash';
import { fetchProfile } from '../services/api';

export function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = _.get(user, 'role', 'user');
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    if (user) {
      fetchProfile()
        .then(data => {
          setProfile(data);
          localStorage.setItem('z_user', JSON.stringify(data));
        })
        .catch(err => console.error(err));
    } else {
      setProfile(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('z_user');
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <UtensilsCrossed size={28} style={{ color: '#e23744' }} /> zomato
      </Link>
      <div className="nav-links">
        {userRole === 'user' && (
          <>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}><HomeIcon size={18} /> Home</Link>
            <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}><TrendingUp size={18} /> Analytics</Link>
            {user && (
              <Link to="/wallet" className={`nav-link ${location.pathname === '/wallet' ? 'active' : ''}`}>
                <Wallet size={18} /> Wallet (₹{parseFloat(profile?.wallet_balance || 0).toFixed(2)}) & Support
              </Link>
            )}
            <Link to="/checkout" className={`nav-link ${location.pathname === '/checkout' ? 'active' : ''}`}><ShoppingCart size={18} /> Cart {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}</Link>
          </>
        )}

        {userRole === 'restaurant' && (
          <>
            <Link to="/restaurant-dashboard" className={`nav-link ${location.pathname === '/restaurant-dashboard' ? 'active' : ''}`}><Store size={18} /> Dashboard</Link>
          </>
        )}

        {userRole === 'admin' && (
          <>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}><HomeIcon size={18} /> Home</Link>
            <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}><TrendingUp size={18} /> Analytics</Link>
            <Link to="/admin-dashboard" className={`nav-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}><ShieldAlert size={18} /> Admin Panel</Link>
          </>
        )}
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Hi, <strong>{_.get(user, 'name', '').split(' ')[0]}</strong> ({userRole})
            </span>
            <button className="filter-btn" onClick={handleLogout} style={{ border: 'none', background: 'rgba(209, 18, 67, 0.15)', color: 'var(--nonveg-color)', cursor: 'pointer' }}><LogOut size={16} /> Logout</button>
          </div>
        ) : (
          <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}><LogIn size={18} /> Login</Link>
        )}
      </div>
    </nav>
  );
}
