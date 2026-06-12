const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { query } = require('../config/db');

// Registration Endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, passwordHash } = req.body;
    const exists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, passwordHash } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0 || result.rows[0].password_hash !== passwordHash) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password Endpoint (Simulated Email)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const exists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (exists.rows.length === 0) return res.status(400).json({ error: 'Email not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await query('INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)', [email, token, expires]);
    
    const resetLink = `http://localhost:5173/login?token=${token}&email=${encodeURIComponent(email)}`;
    
    console.log('\n=========================================');
    console.log(`📬 [EMAIL SENT] to: ${email}`);
    console.log(`Reset link: ${resetLink}`);
    console.log('=========================================\n');

    res.json({ message: 'Reset link simulated in backend server logs.', link: resetLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password Endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPasswordHash } = req.body;
    const valid = await query(
      'SELECT * FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW()',
      [email, token]
    );
    if (valid.rows.length === 0) return res.status(400).json({ error: 'Expired or invalid token' });

    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [newPasswordHash, email]);
    await query('DELETE FROM password_resets WHERE email = $1', [email]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
