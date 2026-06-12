import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import CryptoJS from 'crypto-js';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login'); // login, register, forgot, reset
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');

  useEffect(() => {
    if (token && email) setMode('reset');
  }, [token, email]);

  const hash = p => CryptoJS.SHA256(p).toString(CryptoJS.enc.Hex);

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', minHeight: '70vh', alignItems: 'center' }}>
      <div className="sidebar-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        {error && <div className="tracking-status-banner" style={{ background: 'rgba(209, 18, 67, 0.1)', color: 'var(--nonveg-color)', marginBottom: '1rem' }}><ShieldAlert size={16} />{error}</div>}
        {success && <div className="tracking-status-banner" style={{ background: 'rgba(36, 150, 63, 0.1)', color: 'var(--veg-color)', marginBottom: '1rem' }}><CheckCircle2 size={16} />{success}</div>}

        {mode === 'login' && (
          <div>
            <h3>Login</h3>
            <Formik
              initialValues={{ email: '', password: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  const res = await fetch('http://localhost:5001/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: values.email, passwordHash: hash(values.password) }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  localStorage.setItem('z_user', JSON.stringify(data));
                  navigate('/');
                  window.location.reload();
                } catch (e) { setError(e.message); }
                setSubmitting(false);
              }}
            >
              <Form>
                <div className="form-group"><label className="form-label">Email</label><Field name="email" type="email" className="form-input" required /></div>
                <div className="form-group"><label className="form-label" style={{ display:'flex', justifyContent:'space-between' }}><span>Password</span><span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setMode('forgot')}>Forgot?</span></label><Field name="password" type="password" className="form-input" required /></div>
                <button type="submit" className="checkout-btn">Login</button>
              </Form>
            </Formik>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>New here? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode('register')}>Sign Up</span></p>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <h3>Register</h3>
            <Formik
              initialValues={{ name: '', email: '', password: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  const res = await fetch('http://localhost:5001/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: values.name, email: values.email, passwordHash: hash(values.password) }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  setSuccess('Registration successful! Please login.');
                  setMode('login');
                } catch (e) { setError(e.message); }
                setSubmitting(false);
              }}
            >
              <Form>
                <div className="form-group"><label className="form-label">Name</label><Field name="name" className="form-input" required /></div>
                <div className="form-group"><label className="form-label">Email</label><Field name="email" type="email" className="form-input" required /></div>
                <div className="form-group"><label className="form-label">Password</label><Field name="password" type="password" className="form-input" required /></div>
                <button type="submit" className="checkout-btn">Register</button>
              </Form>
            </Formik>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>Member? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode('login')}>Login</span></p>
          </div>
        )}

        {mode === 'forgot' && (
          <div>
            <h3>Reset Password</h3>
            <Formik
              initialValues={{ email: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  const res = await fetch('http://localhost:5001/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: values.email }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  setSuccess(data.message);
                } catch (e) { setError(e.message); }
                setSubmitting(false);
              }}
            >
              <Form>
                <div className="form-group"><label className="form-label">Email Address</label><Field name="email" type="email" className="form-input" required /></div>
                <button type="submit" className="checkout-btn">Send recovery link</button>
              </Form>
            </Formik>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}><span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode('login')}>Back to Login</span></p>
          </div>
        )}

        {mode === 'reset' && (
          <div>
            <h3>Enter New Password</h3>
            <Formik
              initialValues={{ password: '' }}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  const res = await fetch('http://localhost:5001/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token, newPasswordHash: hash(values.password) }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  setSuccess('Password updated successfully! Redirecting...');
                  setTimeout(() => {
                    navigate('/login');
                    setMode('login');
                    window.history.replaceState({}, document.title, "/login");
                  }, 2000);
                } catch (e) { setError(e.message); }
                setSubmitting(false);
              }}
            >
              <Form>
                <div className="form-group"><label className="form-label">New Password</label><Field name="password" type="password" className="form-input" required /></div>
                <button type="submit" className="checkout-btn">Save Password</button>
              </Form>
            </Formik>
          </div>
        )}

      </div>
    </div>
  );
}
