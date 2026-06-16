import React, { useState, useEffect } from 'react';
import { fetchWallet, addWalletFunds, fetchTickets, createTicket } from '../services/api';
import { Wallet, HelpCircle, ArrowUpRight, MessageSquare, ShieldCheck, ListTodo } from 'lucide-react';

export function WalletSupport() {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [tickets, setTickets] = useState([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [walletLoading, setWalletLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (user) {
      loadWalletData();
      loadTicketData();
    }
  }, []);

  const loadWalletData = async () => {
    try {
      setWalletLoading(true);
      const data = await fetchWallet();
      setWallet(data);
    } catch (err) {
      console.error(err);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadTicketData = async () => {
    try {
      setTicketLoading(true);
      const data = await fetchTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setTicketLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    try {
      await addWalletFunds(parseFloat(topupAmount));
      setSuccessMsg(`Successfully added ₹${topupAmount} to your wallet!`);
      setTopupAmount('');
      loadWalletData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleFileTicket = async (e) => {
    e.preventDefault();
    setTicketSuccess('');
    if (!subject || !message) {
      alert('Please fill out both the subject and description.');
      return;
    }
    try {
      await createTicket(subject, message);
      setTicketSuccess('Support ticket filed successfully! Our admin team is reviewing it.');
      setSubject('');
      setMessage('');
      loadTicketData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
        <Wallet size={36} style={{ color: 'var(--accent)' }} />
        <div>
          <h2 style={{ margin: 0 }}>Zomato Wallet & Support</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Add money to your secure wallet, verify transaction history, and contact customer support.</p>
        </div>
      </div>

      <div className="checkout-layout">
        {/* Left Side: Wallet */}
        <div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={20} style={{ color: 'var(--accent)' }} /> Wallet Balance
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                <ShieldCheck size={14} /> Secured Account
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Balance</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.5rem' }}>
                ₹{walletLoading ? '...' : (wallet.balance || 0).toFixed(2)}
              </div>
            </div>

            {/* Top up form */}
            <form onSubmit={handleTopup}>
              {successMsg && <div className="tracking-status-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1rem' }}>{successMsg}</div>}
              {errorMsg && <div className="tracking-status-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '1rem' }}>{errorMsg}</div>}

              <div className="form-group">
                <label className="form-label">Add Money (INR)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter amount (e.g. 500)"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />
                  <button type="submit" className="checkout-btn" style={{ width: 'auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
                    <ArrowUpRight size={18} /> Topup
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Transaction History */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Transaction History</h3>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {wallet.transactions && wallet.transactions.length > 0 ? (
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.5rem' }}>Date</th>
                      <th style={{ padding: '0.5rem' }}>Description</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.transactions.map((t) => {
                      const isPositive = t.type === 'Topup' || t.type === 'Refund';
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>
                            {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem' }}>{t.description}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: '600', color: isPositive ? '#10b981' : '#ef4444' }}>
                            {isPositive ? '+' : '-'}₹{parseFloat(t.amount).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem 0', margin: 0 }}>No transactions made yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Support Tickets */}
        <div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={20} style={{ color: 'var(--accent)' }} /> File a Complaint / Ticket
            </h3>
            <form onSubmit={handleFileTicket}>
              {ticketSuccess && <div className="tracking-status-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1rem' }}>{ticketSuccess}</div>}

              <div className="form-group">
                <label className="form-label">Subject / Issue Summary</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Delayed delivery or wrong item"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Detailed Message</label>
                <textarea
                  className="form-input"
                  placeholder="Explain your problem here..."
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="checkout-btn" style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} /> Submit Complaint
              </button>
            </form>
          </div>

          {/* Ticket Status */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Support History</h3>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
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
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem 0', margin: 0 }}>No complaints filed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
