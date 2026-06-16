import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminStats, fetchAdminTickets, resolveTicket, assignRider, refundOrder, fetchOrders } from '../services/api';
import { ShieldAlert, Users, Store, DollarSign, ListOrdered, Percent, MessageSquare, AlertCircle, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rider assignment state per order
  const [selectedOrderIdForRider, setSelectedOrderIdForRider] = useState(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderVehicle, setRiderVehicle] = useState('');

  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const statsData = await fetchAdminStats();
      setStats(statsData);
      
      const ticketsData = await fetchAdminTickets();
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);

      const ordersData = await fetchOrders();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError('Failed to fetch platform administration data.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await resolveTicket(ticketId);
      alert('Support ticket resolved successfully!');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignRiderSubmit = async (e, orderId) => {
    e.preventDefault();
    if (!riderName || !riderPhone || !riderVehicle) {
      alert('Please fill out all rider details.');
      return;
    }
    try {
      await assignRider(orderId, riderName, riderPhone, riderVehicle);
      alert(`rider successfully assigned to Order #${orderId}`);
      setSelectedOrderIdForRider(null);
      setRiderName('');
      setRiderPhone('');
      setRiderVehicle('');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRefundOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel and refund Order #${orderId}? The money will be returned to the customer's Zomato Wallet.`)) {
      return;
    }
    try {
      const res = await refundOrder(orderId);
      alert(res.message || 'Refund processed successfully!');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="alert alert-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button className="btn-primary" onClick={loadAdminData}>Retry Loading</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <ShieldAlert size={36} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 style={{ margin: 0 }}>Admin Administration Panel</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Monitor platform performance, view platform-wide financials, and review user accounts and partner restaurants.</p>
          </div>
        </div>
        <button onClick={loadAdminData} className="filter-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="analytics-grid" style={{ marginBottom: '2rem' }}>
        <div className="analytics-card">
          <div className="analytics-header">
            <span className="analytics-title">Total Orders</span>
            <ListOrdered size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="analytics-value">{stats?.orderCount || 0}</div>
          <div className="analytics-sub">Across all partner outlets</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <span className="analytics-title">Gross Sales</span>
            <DollarSign size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="analytics-value">₹{(stats?.totalSales || 0).toLocaleString('en-IN')}</div>
          <div className="analytics-sub">Overall order value processed</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <span className="analytics-title">Commission (10%)</span>
            <Percent size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="analytics-value" style={{ color: '#10b981' }}>₹{(stats?.commission || 0).toLocaleString('en-IN')}</div>
          <div className="analytics-sub">Net platform revenue generated</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <span className="analytics-title">Platform Members</span>
            <Users size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="analytics-value">{stats?.usersCount || 0}</div>
          <div className="analytics-sub">Registered customer accounts</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'users' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'users' ? '600' : '400',
            borderBottom: activeTab === 'users' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          User Accounts ({stats?.users?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('restaurants')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'restaurants' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'restaurants' ? '600' : '400',
            borderBottom: activeTab === 'restaurants' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Registered Restaurants ({stats?.restaurants?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('complaints')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'complaints' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'complaints' ? '600' : '400',
            borderBottom: activeTab === 'complaints' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Complaints & Issues ({tickets?.length || 0})
        </button>
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
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Email Address</th>
                <th style={{ padding: '0.75rem' }}>Access Role</th>
                <th style={{ padding: '0.75rem' }}>Wallet Balance</th>
                <th style={{ padding: '0.75rem' }}>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.users && stats.users.length > 0 ? (
                stats.users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>#{u.id}</td>
                    <td style={{ padding: '0.75rem' }}>{u.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        backgroundColor: u.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : u.role === 'restaurant' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: u.role === 'admin' ? '#ef4444' : u.role === 'restaurant' ? '#f59e0b' : '#3b82f6',
                        textTransform: 'capitalize'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹{(parseFloat(u.wallet_balance || 0)).toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No users registered on the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'restaurants' && (
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Restaurant Name</th>
                <th style={{ padding: '0.75rem' }}>Cuisine Style</th>
                <th style={{ padding: '0.75rem' }}>Rating</th>
                <th style={{ padding: '0.75rem' }}>Address Location</th>
              </tr>
            </thead>
            <tbody>
              {stats?.restaurants && stats.restaurants.length > 0 ? (
                stats.restaurants.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>#{r.id}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{r.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{r.cuisine}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        backgroundColor: parseFloat(r.rating) >= 4.0 ? 'var(--veg-green)' : parseFloat(r.rating) >= 3.0 ? '#f59e0b' : '#ef4444',
                        color: '#ffffff'
                      }}>
                        ★ {parseFloat(r.rating || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.address}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No partner restaurants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.length > 0 ? (
            tickets.map((t) => (
              <div key={t.id} className="card" style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ margin: 0 }}>{t.subject}</h3>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: t.role === 'restaurant' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: t.role === 'restaurant' ? '#f59e0b' : '#3b82f6'
                    }}>
                      {t.role === 'restaurant' ? 'Partner Owner' : 'Customer'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      backgroundColor: t.status === 'Open' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: t.status === 'Open' ? '#ef4444' : '#10b981'
                    }}>
                      {t.status}
                    </span>
                    {t.status === 'Open' && (
                      <button className="success-btn" onClick={() => handleResolveTicket(t.id)} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={14} /> Resolve Issue
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0', fontSize: '0.95rem' }}>{t.message}</p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem', marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Filed by: <strong>{t.user_name}</strong> ({t.user_email})</span>
                  <span>Date: {new Date(t.created_at).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MessageSquare size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <p>No support complaints or tickets filed on the platform.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
                    <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Customer: <strong>{order.customer_name}</strong> ({order.customer_phone})
                    </p>
                    <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Delivery Address: {order.address}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>₹{order.total_price}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', justifyContent: 'flex-end' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: order.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: order.status === 'Cancelled' ? '#ef4444' : order.status === 'Delivered' ? '#10b981' : '#f59e0b'
                      }}>
                        Status: {order.status}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: order.payment_status === 'Refunded' ? 'rgba(239, 68, 68, 0.1)' : order.payment_status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: order.payment_status === 'Refunded' ? '#ef4444' : order.payment_status === 'Paid' ? '#10b981' : '#f59e0b'
                      }}>
                        Payment: {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Items Ordered:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem' }}>
                    {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>
                        {item.name} (x{item.qty}) - ₹{item.price}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.8rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Rider Assigned: <strong>{order.delivery_boy_name || 'None'}</strong> ({order.delivery_boy_vehicle || 'No vehicle'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {order.payment_status === 'Paid' && order.status !== 'Delivered' && (
                      <button className="filter-btn" onClick={() => handleRefundOrder(order.id)} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', border: '1px solid #ef4444', background: 'rgba(239,68,68,0.05)', color: '#ef4444', margin: 0 }}>
                        Cancel & Refund
                      </button>
                    )}
                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <button className="checkout-btn" onClick={() => setSelectedOrderIdForRider(selectedOrderIdForRider === order.id ? null : order.id)} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', margin: 0 }}>
                        {selectedOrderIdForRider === order.id ? 'Close Panel' : 'Reassign Rider'}
                      </button>
                    )}
                  </div>
                </div>

                {selectedOrderIdForRider === order.id && (
                  <form onSubmit={(e) => handleAssignRiderSubmit(e, order.id)} style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0' }}>Assign Custom Delivery Rider</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '0.8rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Rider Name</label>
                        <input type="text" className="form-input" placeholder="e.g. Ramesh Kumar" value={riderName} onChange={e => setRiderName(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Rider Phone</label>
                        <input type="text" className="form-input" placeholder="e.g. +91 9999900000" value={riderPhone} onChange={e => setRiderPhone(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Rider Vehicle Details</label>
                        <input type="text" className="form-input" placeholder="e.g. Activa (KA-03-MK-1234)" value={riderVehicle} onChange={e => setRiderVehicle(e.target.value)} required />
                      </div>
                    </div>
                    <button type="submit" className="checkout-btn" style={{ padding: '0.4rem 1.2rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Send size={12} /> Confirm Rider Assignment
                    </button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <AlertCircle size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
              <p>No active logistics orders in system.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
