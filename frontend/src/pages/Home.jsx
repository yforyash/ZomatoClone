import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Star } from 'lucide-react';
import { RestaurantShimmer } from '../components/Shimmer';

export function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [veg, setVeg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('z_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      if (user.role === 'restaurant') {
        navigate('/restaurant-dashboard');
        return;
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
        return;
      }
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchData(1, true);
  }, [search, veg]);

  useEffect(() => {
    if (page > 1) fetchData(page, false);
  }, [page]);

  const fetchData = async (pNum, isReset) => {
    if (isReset) setLoading(true);
    else setLoadingMore(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      let url = `${API_URL}/api/restaurants?page=${pNum}&limit=6`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (veg) url += `&veg=true`;

      const res = await fetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      if (isReset) setRestaurants(list);
      else {
        setRestaurants(prev => {
          const ids = new Set(prev.map(r => r.id));
          return [...prev, ...list.filter(r => !ids.has(r.id))];
        });
      }
      if (list.length < 6) setHasMore(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 120) {
        if (!loading && !loadingMore && hasMore) setPage(p => p + 1);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, loadingMore, hasMore]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="hero-section">
        <h1 className="hero-title">Discover the best food & drinks</h1>
        <p className="hero-subtitle">Premium local recipes delivered straight to your door step</p>
        <div className="search-container">
          <Search size={18} style={{ color: 'var(--accent)', marginRight: '0.8rem' }} />
          <input className="search-input" placeholder="Search cuisines, restaurants..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </header>
      <div className="container">
        <div className="filters-bar">
          <button className={`filter-btn ${veg ? 'active' : ''}`} onClick={() => setVeg(!veg)}>
            <ShieldCheck size={16} /> Pure Veg
          </button>
        </div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Popular Restaurants</h2>
        {loading ? (
          <RestaurantShimmer count={6} />
        ) : (
          <>
            <div className="restaurant-grid">
              {restaurants.map((res, idx) => (
                <motion.div
                  key={res.id}
                  className="restaurant-card"
                  onClick={() => navigate(`/restaurant/${res.id}`)}
                  whileHover={{ y: -8 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 6) * 0.05 }}
                >
                  <div className="card-img-wrapper">
                    <img src={res.image_url} alt={res.name} className="card-img" />
                    {res.is_pure_veg && <span className="veg-tag">Veg</span>}
                    <span className="time-tag">{res.delivery_time} mins</span>
                  </div>
                  <div className="card-content">
                    <div className="card-header">
                      <h3 className="card-title">{res.name}</h3>
                      <span className="rating-badge">{parseFloat(res.rating).toFixed(1)} <Star size={10} fill="white" /></span>
                    </div>
                    <div className="card-cuisines">{res.cuisine}</div>
                    <div className="card-footer">
                      <span>{res.address?.split(',')[0]}</span>
                      <span className="card-price">₹{res.cost_for_two} for two</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {loadingMore && <div style={{ marginTop: '2rem' }}><RestaurantShimmer count={3} /></div>}
            {!hasMore && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>No more restaurants left.</p>}
          </>
        )}
      </div>
    </motion.div>
  );
}
