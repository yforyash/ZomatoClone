const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const authCheck = require('../middlewares/authCheck');

// Middleware to verify Admin role
async function verifyAdmin(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId || userId === 'Anonymous') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const userRes = await query('SELECT role FROM users WHERE id = $1', [parseInt(userId)]);
    const user = userRes.rows[0];
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all support tickets
router.get('/tickets', authCheck, verifyAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, u.name as user_name, u.email as user_email 
       FROM support_tickets t 
       JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve a support ticket
router.post('/tickets/:id/resolve', authCheck, verifyAdmin, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const result = await query(
      `UPDATE support_tickets SET status = 'Resolved' WHERE id = $1 RETURNING *`,
      [ticketId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign a different rider to an order
router.post('/orders/:id/assign-rider', authCheck, verifyAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { riderName, riderPhone, riderVehicle } = req.body;
    
    if (!riderName || !riderPhone || !riderVehicle) {
      return res.status(400).json({ error: 'Rider details (name, phone, vehicle) are required.' });
    }

    const result = await query(
      `UPDATE orders 
       SET delivery_boy_name = $1, delivery_boy_phone = $2, delivery_boy_vehicle = $3
       WHERE id = $4 RETURNING *`,
      [riderName, riderPhone, riderVehicle, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process a refund for an order
router.post('/orders/:id/refund', authCheck, verifyAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.payment_status === 'Refunded') {
      return res.status(400).json({ error: 'Order is already refunded.' });
    }

    const amount = parseFloat(order.total_price);
    const customerUserId = order.user_id;

    // Begin Transaction
    await query('BEGIN');

    // Update order status
    await query(
      `UPDATE orders SET payment_status = 'Refunded', status = 'Cancelled' WHERE id = $1`,
      [orderId]
    );

    if (customerUserId) {
      // Add refund amount to user's wallet
      await query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [amount, customerUserId]
      );

      // Log wallet transaction
      await query(
        `INSERT INTO wallet_transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'Refund', $3)`,
        [customerUserId, amount, `Refund for cancelled order #${orderId}`]
      );
    }

    await query('COMMIT');

    res.json({ success: true, message: `Refund of ₹${amount} successfully credited to user wallet.` });
  } catch (err) {
    await query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
