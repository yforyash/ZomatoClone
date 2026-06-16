import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminStats } from '../services/api';
import { ShieldAlert, Users, Store, DollarSign, ListOrdered, Percent } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminStats();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError('Failed to fetch platform administration data. Please try again.');
    } finally {
      setLoading(false);
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
          <button className="btn-primary" onClick={loadAdminStats}>Retry Loading</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
        <ShieldAlert size={36} style={{ color: 'var(--accent)' }} />
        <div>
          <h2 style={{ margin: 0 }}>Admin Administration Panel</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Monitor platform performance, view platform-wide financials, and review user accounts and partner restaurants.</p>
        </div>
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
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'users' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'users' ? '600' : '400',
            borderBottom: activeTab === 'users' ? '2px solid var(--accent)' : 'none',
            padding: '0.5rem 1rem',
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
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Registered Restaurants ({stats?.restaurants?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' ? (
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Email Address</th>
                <th style={{ padding: '0.75rem' }}>Access Role</th>
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
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No users registered on the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
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
    </div>
  );
}
