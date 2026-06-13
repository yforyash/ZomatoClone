import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { IndianRupee, ShoppingBag } from 'lucide-react';

export function Analytics() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const ords = await (await fetch(`${API_URL}/api/orders`)).json();
      setOrders(Array.isArray(ords) ? ords : []);
      const rests = await (await fetch(`${API_URL}/api/restaurants`)).json();
      setRestaurants(Array.isArray(rests) ? rests : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  const totalOrders = orders.length;

  const spendingMap = {};
  orders.forEach(o => {
    const d = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    spendingMap[d] = (spendingMap[d] || 0) + parseFloat(o.total_price);
  });
  const spendChart = Object.keys(spendingMap).map(k => ({ date: k, Spent: spendingMap[k] }));
  const ratingsChart = restaurants.map(r => ({ name: r.name.substring(0,10), Rating: parseFloat(r.rating) }));

  return (
    <div className="container">
      <h2 style={{ marginBottom: '1.5rem' }}>Dining Insights</h2>
      <div className="analytics-grid">
        <div className="stats-card highlight"><div><span className="stats-label">Total Outflow</span><span className="stats-value">₹{totalSpent}</span></div><IndianRupee /></div>
        <div className="stats-card"><div><span className="stats-label">Total Orders</span><span className="stats-value">{totalOrders}</span></div><ShoppingBag /></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Spending History</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendChart.length ? spendChart : [{ date: 'Today', Spent: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Area type="monotone" dataKey="Spent" stroke="#e23744" fill="#e23744" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Restaurant Ratings</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingsChart.length ? ratingsChart : [{ name: 'None', Rating: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis domain={[0, 5]} stroke="#999" />
                <Tooltip />
                <Bar dataKey="Rating" fill="#ff9f00" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
