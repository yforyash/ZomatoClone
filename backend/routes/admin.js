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

// Get all pending dishes for approval
router.get('/pending-dishes', authCheck, verifyAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, r.name as restaurant_name 
       FROM menu_items m
       JOIN restaurants r ON m.restaurant_id = r.id
       WHERE m.status = 'pending'
       ORDER BY m.id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or reject a dish
router.put('/dishes/:dishId', authCheck, verifyAdmin, async (req, res) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const { status } = req.body; // 'approved' or 'rejected'

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: "Invalid status. Must be 'approved' or 'rejected'." });
    }

    if (status === 'approved') {
      const dishRes = await query('SELECT owner_price FROM menu_items WHERE id = $1', [dishId]);
      const dish = dishRes.rows[0];
      if (!dish) {
        return res.status(404).json({ error: 'Dish not found' });
      }
      
      const finalPrice = Math.round(parseFloat(dish.owner_price) * 1.10);
      
      const updateRes = await query(
        `UPDATE menu_items SET status = 'approved', price = $1 WHERE id = $2 RETURNING *`,
        [finalPrice, dishId]
      );
      res.json(updateRes.rows[0]);
    } else {
      const updateRes = await query(
        `UPDATE menu_items SET status = 'rejected' WHERE id = $1 RETURNING *`,
        [dishId]
      );
      res.json(updateRes.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get system analytics (fees collected)
router.get('/analytics', authCheck, verifyAdmin, async (req, res) => {
  try {
    const ordersRes = await query("SELECT total_price FROM orders WHERE payment_status = 'Paid'");
    const orders = ordersRes.rows;
    
    const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
    const commission = totalSales * 0.10;
    
    const restSalesRes = await query(
      `SELECT r.id, r.name, SUM(o.total_price) as total_sales
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN restaurants r ON u.restaurant_id = r.id
       WHERE o.payment_status = 'Paid'
       GROUP BY r.id, r.name`
    );
    
    res.json({
      totalSales,
      commission,
      restaurantSales: restSalesRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
