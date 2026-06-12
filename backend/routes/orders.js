const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// Place New Order
router.post('/', async (req, res) => {
  try {
    const { items, total_price, address, latitude, longitude, payment_method, payment_status, customer_name, customer_phone } = req.body;
    const result = await query(
      `INSERT INTO orders (items, total_price, address, latitude, longitude, payment_method, payment_status, customer_name, customer_phone) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [JSON.stringify(items), total_price, address, latitude, longitude, payment_method || 'COD', payment_status || 'Paid', customer_name || 'Anonymous', customer_phone || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Order History (Parsed Items)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    const list = result.rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
    }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server-Sent Events (SSE) Live Delivery Tracking
router.get('/:id/track', async (req, res) => {
  try {
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderRes.rows.length === 0) return res.status(404).end();
    const order = orderRes.rows[0];
    const userLat = parseFloat(order.latitude);
    const userLng = parseFloat(order.longitude);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const startLat = 28.6139; // Delhi center
    const startLng = 77.2090;

    let step = 0;
    const totalSteps = 10;
    res.write('data: ' + JSON.stringify({ status: 'Preparing Food', lat: startLat, lng: startLng }) + '\n\n');

    const interval = setInterval(async () => {
      step++;
      if (step <= 2) {
        res.write('data: ' + JSON.stringify({ status: 'Preparing Food', lat: startLat, lng: startLng }) + '\n\n');
      } else if (step < totalSteps) {
        const ratio = (step - 2) / (totalSteps - 2);
        const currentLat = startLat + (userLat - startLat) * ratio;
        const currentLng = startLng + (userLng - startLng) * ratio;
        res.write('data: ' + JSON.stringify({ status: 'Out for Delivery', lat: currentLat, lng: currentLng }) + '\n\n');
      } else {
        res.write('data: ' + JSON.stringify({ status: 'Delivered', lat: userLat, lng: userLng }) + '\n\n');
        await query("UPDATE orders SET status = 'Delivered' WHERE id = $1", [req.params.id]);
        clearInterval(interval);
        res.end();
      }
    }, 2000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (err) {
    res.status(500).end();
  }
});

module.exports = router;
