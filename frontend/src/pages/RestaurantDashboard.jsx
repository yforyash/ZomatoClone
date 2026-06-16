import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRestaurantStats, fetchOrders, requestWithdrawal } from '../services/api';
import { UniversalMap } from '../components/UniversalMap';
import { Store, DollarSign, ListOrdered, Navigation, ArrowDownCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import _ from 'lodash';

export function RestaurantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
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
      const statsData = await fetchRestaurantStats();
      setStats(statsData);

      const ordersData = await fetchOrders();
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to load dashboard:', err.message);
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
          // Reload orders list to update status
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
      setErrorMsg('Please enter payment details (UPI ID or Bank Details).');
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

  if (!stats) return <div className="spinner-container"><div className="spinner"></div></div>;

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

      <div className="checkout-layout">
        
        {/* Left column: Orders list & Withdrawal */}
        <div className="checkout-form-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Incoming/Active Orders */}
          <div className="sidebar-panel">
            <h3>Active & Past Orders</h3>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No orders placed with your restaurant yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxH: '500px', overflowY: 'auto' }}>
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

          {/* Withdrawal Section */}
          <div className="sidebar-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ArrowDownCircle size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0 }}>Withdraw Earnings</h3>
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

              <button type="submit" className="checkout-btn">Request Payout</button>
            </form>
          </div>

        </div>

        {/* Right column: Delivery Tracking Map & Info */}
        <div className="checkout-summary-section">
          <div className="sidebar-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
            <h3>Delivery & Location Tracking</h3>
            
            {selectedOrder ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                
                {/* Rider Details Banner */}
                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    <Navigation size={16} /> Status: {trackingStatus}
                  </div>
                  <div>Rider: <strong>{deliveryBoy?.name}</strong> ({deliveryBoy?.phone})</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Vehicle: {deliveryBoy?.vehicle}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Customer Drop Address: {selectedOrder.address}</div>
                </div>

                {/* Tracking Map */}
                <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
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
                <p style={{ textAlign: 'center', margin: 0 }}>Select an order from the list to view customer drop location, delivery boy status, and track real-time coordinates.</p>
              </div>
            )}

            {/* Payouts list */}
            {stats.withdrawals.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Payout History</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {stats.withdrawals.map((w) => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <div>
                        <strong>₹{w.amount}</strong> via {w.payment_method}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Details: {w.details}</div>
                      </div>
                      <span style={{ color: 'var(--veg-color)' }}>{w.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
