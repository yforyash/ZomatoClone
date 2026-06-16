import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRestaurantStats, fetchOrders, requestWithdrawal, fetchReviews, fetchTickets, createTicket } from '../services/api';
import { UniversalMap } from '../components/UniversalMap';
import { Store, DollarSign, ListOrdered, Navigation, ArrowDownCircle, CheckCircle2, AlertCircle, MessageSquare, HelpCircle, Star } from 'lucide-react';
import _ from 'lodash';

export function RestaurantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);

  // Tracking details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [riderPos, setRiderPos] = useState(null);
  const [restPos, setRestPos] = useState(null);
  const [customerPos, setCustomerPos] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('');
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  
  // Withdrawal Form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('UPI');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  const sseRef = useRef(null);

  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user || user.role !== 'restaurant') {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsData = await fetchRestaurantStats();
      setStats(statsData);

      const ordersData = await fetchOrders();
      setOrders(ordersData);

      if (user?.restaurant_id) {
        const reviewsData = await fetchReviews(user.restaurant_id);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      }

      const ticketsData = await fetchTickets();
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);

    } catch (err) {
      console.error('Failed to load dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = (order) => {
    if (sseRef.current) {
      sseRef.current.close();
    }
    setSelectedOrder(order);
    setDeliveryBoy(null);
    setRiderPos(null);
    setRestPos(null);
    setCustomerPos(null);
    setTrackingStatus('Connecting...');

    const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';
    const source = new EventSource(`${BASE_URL}/orders/${order.id}/track`);
    sseRef.current = source;

    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setTrackingStatus(data.status);
        if (data.restaurant) {
          setRestPos([parseFloat(data.restaurant.lat), parseFloat(data.restaurant.lng)]);
        }
        if (data.customer) {
          setCustomerPos([parseFloat(data.customer.lat), parseFloat(data.customer.lng)]);
        }
        if (data.lat && data.lng) {
          setRiderPos([parseFloat(data.lat), parseFloat(data.lng)]);
        }
        if (data.delivery_boy) {
          setDeliveryBoy(data.delivery_boy);
        }
        if (data.status === 'Delivered') {
          source.close();
          setTimeout(loadDashboardData, 1000);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    source.onerror = () => {
      setTrackingStatus('Offline');
      source.close();
    };
  };

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setErrorMsg('Please enter a valid amount to withdraw.');
      return;
    }

    if (!withdrawDetails) {
      setErrorMsg('Please enter payment details.');
      return;
    }

    try {
      await requestWithdrawal(parseFloat(withdrawAmount), withdrawMethod, withdrawDetails);
      setSuccessMsg('Withdrawal processed successfully!');
      setWithdrawAmount('');
      setWithdrawDetails('');
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleFileTicket = async (e) => {
    e.preventDefault();
    setTicketSuccess('');
    if (!ticketSubject || !ticketMessage) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      await createTicket(ticketSubject, ticketMessage);
      setTicketSuccess('Support ticket filed successfully!');
      setTicketSubject('');
      setTicketMessage('');
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading || !stats) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
        <Store size={36} style={{ color: 'var(--accent)' }} />
        <div>
          <h2 style={{ margin: 0 }}>Restaurant Portal</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage orders, trace delivery boys, and track your business earnings.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="analytics-grid" style={{ marginBottom: '2rem' }}>
        <div className="analytics-card">
          <div className="analytics-header">
            <span className="analytics-title">Total Orders</span>
            <ListOrdered size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="analytics-value">{stats.orderCount}</div>
          <div className="analytics-sub">Successful paid sales</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <span className="analytics-title">Gross Revenue</span>
            <DollarSign size={20} style={{ color: 'var(--veg-color)' }} />
          </div>
          <div className="analytics-value">₹{stats.totalSales}</div>
          <div className="analytics-sub">10% commission: ₹{stats.commission}</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <span className="analytics-title">Net Earnings</span>
            <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="analytics-value" style={{ color: 'var(--veg-color)' }}>₹{stats.netEarnings}</div>
          <div className="analytics-sub">Available balance: ₹{stats.remainingBalance}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('orders')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'orders' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'orders' ? '600' : '400',
            borderBottom: activeTab === 'orders' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Orders & Logistics ({orders?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('finances')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'finances' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'finances' ? '600' : '400',
            borderBottom: activeTab === 'finances' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Manage Finances
        </button>
        <button 
          onClick={() => setActiveTab('reviews')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'reviews' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'reviews' ? '600' : '400',
            borderBottom: activeTab === 'reviews' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Customer Reviews ({reviews?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('support')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'support' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'support' ? '600' : '400',
            borderBottom: activeTab === 'support' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Support Complaints ({tickets?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'orders' && (
        <div className="checkout-layout">
          {/* Left Column: Orders List */}
          <div className="sidebar-panel">
            <h3>Active & Past Orders</h3>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No orders placed with your restaurant yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className={`menu-item-card ${selectedOrder?.id === order.id ? 'active-border' : ''}`}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: selectedOrder?.id === order.id ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                    onClick={() => startTracking(order)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>Order #{order.id}</strong>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {_.get(order, 'items', []).map(i => `${i.name} (x${i.qty})`).join(', ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Customer: {order.customer_name}</span>
                      <strong>₹{order.total_price}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Tracking Map */}
          <div className="checkout-summary-section">
            <div className="sidebar-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3>Delivery & Location Tracking</h3>
              {selectedOrder ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      <Navigation size={16} /> Status: {trackingStatus}
                    </div>
                    <div>Rider Assigned: <strong>{deliveryBoy?.name || selectedOrder.delivery_boy_name}</strong></div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Vehicle: {deliveryBoy?.vehicle || selectedOrder.delivery_boy_vehicle}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Customer Drop Address: {selectedOrder.address}</div>
                  </div>
                  <div style={{ height: '280px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <UniversalMap 
                      center={customerPos || [28.6139, 77.2090]} 
                      markerTitle="Drop Location (Customer)"
                      riderPos={riderPos}
                      restPos={restPos}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  <Navigation size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ textAlign: 'center', margin: 0 }}>Select an order from the list to view drop coordinates and rider updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finances' && (
        <div className="checkout-layout">
          {/* Request Withdrawal */}
          <div className="sidebar-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ArrowDownCircle size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0 }}>Request Payout</h3>
            </div>
            
            {successMsg && <div className="tracking-status-banner" style={{ background: 'rgba(36, 150, 63, 0.1)', color: 'var(--veg-color)', marginBottom: '1rem' }}><CheckCircle2 size={16} />{successMsg}</div>}
            {errorMsg && <div className="tracking-status-banner" style={{ background: 'rgba(209, 18, 67, 0.1)', color: 'var(--nonveg-color)', marginBottom: '1rem' }}><AlertCircle size={16} />{errorMsg}</div>}

            <form onSubmit={handleWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Amount to Withdraw (INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remaining balance: ₹{stats.remainingBalance}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-input" 
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  style={{ background: 'var(--bg-primary)', color: 'white' }}
                >
                  <option value="UPI">UPI Transfer</option>
                  <option value="Bank">Bank Wire Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Details (UPI ID / Account Details)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={withdrawMethod === 'UPI' ? 'name@okaxis' : 'Bank, A/C: 12345, IFSC: ABCD0123'}
                  value={withdrawDetails}
                  onChange={(e) => setWithdrawDetails(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" className="checkout-btn">Submit Request</button>
            </form>
          </div>

          {/* Payout History */}
          <div className="sidebar-panel">
            <h3>Payout History</h3>
            {stats.withdrawals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                {stats.withdrawals.map((w) => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div>
                      <strong>₹{w.amount}</strong> via {w.payment_method}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Details: {w.details}</div>
                    </div>
                    <span style={{ color: 'var(--veg-color)', fontWeight: '600' }}>{w.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No payouts requested yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3>Customer Reviews & Feedback</h3>
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong>{r.reviewer_name}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#ffeeb4', color: '#855800', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      ★ {r.rating}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{r.comment}</p>
                  {r.tags && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {r.tags.split(',').map((tag, idx) => (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>No customer reviews posted for your restaurant yet.</p>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div className="checkout-layout">
          {/* File ticket */}
          <div className="sidebar-panel">
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={20} style={{ color: 'var(--accent)' }} /> Contact Partner Support
            </h3>
            <form onSubmit={handleFileTicket}>
              {ticketSuccess && <div className="tracking-status-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1rem' }}>{ticketSuccess}</div>}

              <div className="form-group">
                <label className="form-label">Subject / Issue Summary</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Delayed payout or rider issue"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Detailed Message</label>
                <textarea
                  className="form-input"
                  placeholder="Explain your problem here..."
                  rows="4"
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="checkout-btn" style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} /> Submit Complaint
              </button>
            </form>
          </div>

          {/* Tickets List */}
          <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Support History</h3>
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {tickets.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tickets.map((t) => (
                    <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{t.subject}</strong>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: t.status === 'Open' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: t.status === 'Open' ? '#ef4444' : '#10b981'
                        }}>
                          {t.status}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.message}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Filed on: {new Date(t.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No support complaints filed yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
