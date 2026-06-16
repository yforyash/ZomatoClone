import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { MapPin, Star, Phone, CheckCircle2, Heart } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { UniversalMap } from '../components/UniversalMap';
import { checkFavorite, toggleFavorite } from '../services/api';

function StarRating({ rating, size = 16 }) {
  const rounded = parseFloat(rating) || 0;
  return (
    <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
      {[...Array(5)].map((_, i) => {
        const fillPercent = Math.max(0, Math.min(100, (rounded - i) * 100));
        return (
          <div key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
            <Star size={size} style={{ color: '#475569', position: 'absolute', top: 0, left: 0 }} />
            {fillPercent > 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: `${fillPercent}%`, overflow: 'hidden', height: '100%' }}>
                <Star size={size} style={{ color: 'var(--rating-yellow)' }} fill="var(--rating-yellow)" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReviewForm({ restaurantId, onReviewSubmitted }) {
  const [tags, setTags] = useState([]);
  const [success, setSuccess] = useState(false);

  const availableTags = ['Delicious Food', 'Great Packaging', 'Super Fast Delivery', 'Friendly Staff', 'Value for Money'];
  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  return (
    <div className="review-form-container">
      <h3>Rate your experience</h3>
      {success && <div className="tracking-status-banner" style={{ background: 'rgba(36, 150, 63, 0.1)', color: 'var(--veg-color)', marginBottom: '1rem' }}><CheckCircle2 size={16} /> Review posted!</div>}

      <Formik
        initialValues={{ reviewer_name: '', rating: 5, comment: '' }}
        validationSchema={Yup.object({
          reviewer_name: Yup.string().required('Required'),
          comment: Yup.string().min(5, 'Minimum 5 characters').required('Required'),
        })}
        onSubmit={async (values, { resetForm }) => {
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            await fetch(`${API_URL}/api/reviews/${restaurantId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...values, tags: tags.join(',') }),
            });
            setSuccess(true);
            setTags([]);
            resetForm();
            onReviewSubmitted();
            setTimeout(() => setSuccess(false), 3000);
          } catch (e) {
            alert('Error posting review');
          }
        }}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <Field name="reviewer_name" className="form-input" />
              <ErrorMessage name="reviewer_name" component="div" className="form-error" />
            </div>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" className={`star-btn ${values.rating >= star ? 'active' : ''}`} onClick={() => setFieldValue('rating', star)}>
                    <Star size={20} fill={values.rating >= star ? 'var(--rating-yellow)' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Review Tags</label>
              <div className="review-tags">
                {availableTags.map(t => (
                  <button key={t} type="button" onClick={() => toggleTag(t)} className={`filter-btn ${tags.includes(t) ? 'active' : ''}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Comment</label>
              <Field name="comment" as="textarea" className="form-input" rows="3" />
              <ErrorMessage name="comment" component="div" className="form-error" />
            </div>
            <button type="submit" className="checkout-btn">Submit Review</button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, cartItems, cartTotal } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('menu');
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role || 'user';

  const checkFavStatus = async () => {
    if (user) {
      try {
        const res = await checkFavorite(id);
        setIsFavorited(!!res.favorited);
      } catch (err) {
        console.error('Failed to check favorite status:', err);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await toggleFavorite(id);
      setIsFavorited(res.favorited);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const fetchDetails = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const resData = await (await fetch(`${API_URL}/api/restaurants/${id}`)).json();
      setRestaurant(resData);
      const loggedUser = localStorage.getItem('z_user') ? JSON.parse(localStorage.getItem('z_user')) : null;
      const mData = await (await fetch(`${API_URL}/api/restaurants/${id}/menu`, {
        headers: {
          'x-user-id': loggedUser ? loggedUser.id.toString() : 'Anonymous'
        }
      })).json();
      setMenu(Array.isArray(mData) ? mData : []);
      await fetchReviews();
    } catch (e) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const revs = await (await fetch(`${API_URL}/api/reviews/${id}`)).json();
      setReviews(Array.isArray(revs) ? revs : []);
    } catch (e) {
      setReviews([]);
    }
  };

  useEffect(() => { 
    fetchDetails(); 
    checkFavStatus();
  }, [id]);

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  const categories = menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const scrollToCategory = (catName) => {
    const el = document.getElementById(`cat-${catName}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <div className="restaurant-hero" style={{ backgroundImage: `url(${restaurant.image_url})` }}>
        <div className="restaurant-hero-overlay"></div>
        <div className="restaurant-hero-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h1 className="restaurant-hero-title" style={{ margin: 0 }}>{restaurant.name}</h1>
              {user && (
                <button 
                  onClick={handleToggleFavorite}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(4px)',
                    color: isFavorited ? '#ef4444' : '#ffffff'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart size={20} fill={isFavorited ? '#ef4444' : 'none'} style={{ transition: 'fill 0.2s ease' }} />
                </button>
              )}
            </div>
            <p className="restaurant-hero-cuisines" style={{ marginTop: '0.4rem' }}>{restaurant.cuisine}</p>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', margin: '0.4rem 0' }}>
              <StarRating rating={restaurant.rating} size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{parseFloat(restaurant.rating).toFixed(1)} / 5</span>
            </div>
            <p className="restaurant-hero-address"><MapPin size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />{restaurant.address}</p>
          </div>
          <div className="restaurant-rating-stats">
            <div className="rating-stat-box">
              <div className="rating-stat-value">{parseFloat(restaurant.rating).toFixed(1)} <Star size={12} fill="var(--rating-yellow)" /></div>
              <div className="rating-stat-label">{restaurant.rating_count} Reviews</div>
            </div>
            <div className="rating-stat-box">
              <div className="rating-stat-value">₹{restaurant.cost_for_two}</div>
              <div className="rating-stat-label">Cost for Two</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="tabs-navigation">
          <button className={`tab-btn ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>Online Menu</button>
          <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Reviews</button>
        </div>

        <div className="detail-layout">
          
          <div className="detail-main-content">
            
            {tab === 'menu' && Object.keys(categories).length > 0 && (
              <div className="menu-category-sidebar">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CATEGORIES</span>
                {Object.keys(categories).map(cat => (
                  <button key={cat} onClick={() => scrollToCategory(cat)} className="filter-btn" style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '0.3rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div style={{ flex: 1 }}>
              {tab === 'menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {Object.keys(categories).map(cat => (
                    <div key={cat} id={`cat-${cat}`}>
                      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem', color: 'var(--accent)' }}>{cat}</h3>
                      <div className="menu-list">
                        {categories[cat].map(item => {
                          const cartItem = cartItems.find(ci => ci.id === item.id);
                          const isOwnerOrAdmin = userRole === 'admin' || (userRole === 'restaurant' && user?.restaurant_id === restaurant?.id);
                          return (
                            <div key={item.id} className="menu-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                              <div className="item-info" style={{ flex: 1 }}>
                                <span className={`item-veg-indicator ${!item.is_veg ? 'nonveg' : ''}`}><span className="item-veg-dot"></span></span>
                                {item.is_bestseller && <span style={{ background: '#f5a623', color: 'black', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, marginLeft: '0.5rem', verticalAlign: 'middle' }}>★ BESTSELLER</span>}
                                <h4 className="item-name" style={{ marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {item.name}
                                  {item.status && item.status !== 'approved' && (
                                    <span style={{ 
                                      fontSize: '0.65rem', 
                                      padding: '0.15rem 0.4rem', 
                                      borderRadius: '4px', 
                                      fontWeight: 600, 
                                      textTransform: 'uppercase',
                                      backgroundColor: item.status === 'pending' ? 'rgba(245, 166, 35, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                      color: item.status === 'pending' ? '#f5a623' : '#ef4444',
                                      border: `1px solid ${item.status === 'pending' ? '#f5a623' : '#ef4444'}`
                                    }}>
                                      {item.status}
                                    </span>
                                  )}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                  <span className="item-price" style={{ fontSize: '1.05rem', fontWeight: 600 }}>₹{item.price}</span>
                                  {isOwnerOrAdmin && item.owner_price && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      Proposed: ₹{parseFloat(item.owner_price).toFixed(2)} + 10% Zomato fee (₹{(parseFloat(item.owner_price) * 0.1).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                                <p className="item-desc" style={{ marginTop: '0.4rem' }}>{item.description}</p>
                              </div>
                              <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }}>
                                  {item.status && item.status !== 'approved' ? (
                                    <div style={{ background: 'var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                                      Not Available
                                    </div>
                                  ) : cartItem ? (
                                    <div className="add-cart-btn" style={{ background: 'var(--accent)', color: 'white', display: 'flex', justifyContent: 'space-between', width: '72px', margin: 0, boxShadow: '0 4px 8px rgba(0,0,0,0.2)', padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}>
                                      <button className="qty-btn" style={{ color: 'white' }} onClick={() => removeFromCart(item.id)}>-</button>
                                      <span>{cartItem.qty}</span>
                                      <button className="qty-btn" style={{ color: 'white' }} onClick={() => addToCart(item, restaurant)}>+</button>
                                    </div>
                                  ) : (
                                    <button className="add-cart-btn" style={{ margin: 0, boxShadow: '0 4px 8px rgba(0,0,0,0.2)', padding: '0.2rem 0.6rem', fontSize: '0.85rem' }} onClick={() => addToCart(item, restaurant)}>Add +</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    gap: '2rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ textAlign: 'center', minWidth: '150px' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                        {parseFloat(restaurant.rating).toFixed(1)}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0.5rem' }}>
                        out of 5
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <StarRating rating={restaurant.rating} size={20} />
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        {restaurant.rating_count} customer ratings
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '250px' }}>
                      {[5, 4, 3, 2, 1].map(starsCount => {
                        const count = reviews.filter(r => Math.round(r.rating) === starsCount).length;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={starsCount} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
                            <span style={{ width: '45px', color: 'var(--text-secondary)', textAlign: 'right' }}>{starsCount} Star</span>
                            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: 'var(--rating-yellow)', width: `${percentage}%`, borderRadius: '4px' }}></div>
                            </div>
                            <span style={{ width: '35px', color: 'var(--text-muted)' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: '0.8rem' }}>About this kitchen</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Elegantly serving local dishes prepared fresh on order. Ideal for cozy dining experiences at home.</p>
                    <p style={{ fontWeight: 600, marginBottom: '1.5rem' }}><Phone size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> Phone: {restaurant.phone}</p>
                    <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden' }}>
                      <UniversalMap center={[parseFloat(restaurant.latitude), parseFloat(restaurant.longitude)]} markerTitle={restaurant.name} />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'reviews' && (
                <div className="reviews-section">
                  <ReviewForm restaurantId={restaurant.id} onReviewSubmitted={fetchDetails} />
                  <h3 style={{ margin: '1.5rem 0 0.8rem' }}>Customer Reviews</h3>
                  {reviews.map(rev => (
                    <div key={rev.id} className="review-card" style={{ marginBottom: '1rem' }}>
                      <div className="review-card-header">
                        <h4>{rev.reviewer_name}</h4>
                        <span className="rating-badge">{rev.rating} <Star size={10} fill="white" /></span>
                      </div>
                      {rev.tags && <div className="review-tags">{rev.tags.split(',').map(t => <span key={t} className="review-tag">{t}</span>)}</div>}
                      <p className="review-comment">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="detail-sidebar">
            <div className="sidebar-panel">
              <h3 className="panel-title">Basket</h3>
              {cartItems.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Empty Basket</p>
              ) : (
                <>
                  <div className="cart-items-list">
                    {cartItems.map(item => (
                      <div key={item.id} className="cart-item-row">
                        <div>{item.name} x {item.qty}</div>
                        <div>₹{item.price * item.qty}</div>
                      </div>
                    ))}
                  </div>
                  <div className="cart-summary">
                    <div className="summary-row total"><span>Total</span><span>₹{cartTotal + 40}</span></div>
                    <button className="checkout-btn" onClick={() => navigate('/checkout')}>Proceed to Pay</button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
