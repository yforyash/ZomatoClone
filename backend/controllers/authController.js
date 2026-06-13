const crypto = require('crypto');
const authService = require('../services/authService');
const emailService = require('../services/emailService');

async function register(req, res) {
  try {
    const { name, email, passwordHash } = req.body;
    
    const exists = await authService.getUserByEmail(email);
    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await authService.createUser(name, email, passwordHash);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, passwordHash } = req.body;
    
    const user = await authService.getUserByEmail(email);
    
    if (!user || user.password_hash !== passwordHash) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    const user = await authService.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await authService.createPasswordReset(email, token, expiresAt);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/login?token=${token}&email=${encodeURIComponent(email)}`;
    
    await emailService.sendResetEmail(email, resetLink);

    res.json({ message: 'Password reset link sent successfully.', link: resetLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, token, newPasswordHash } = req.body;
    
    const validReset = await authService.getValidResetToken(email, token);
    if (!validReset) {
      return res.status(400).json({ error: 'Expired or invalid token' });
    }

    await authService.updatePassword(email, newPasswordHash);
    await authService.deleteResetTokens(email);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
