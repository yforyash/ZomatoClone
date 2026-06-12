const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// Fetch All Restaurants (Paged + Filters + Simulated Network Delay)
router.get('/', async (req, res) => {
  try {
    const { search, veg } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    // Simulated network delay (for Shimmer throttle loading demonstration)
    await new Promise(resolve => setTimeout(resolve, 1500));

    let queryText = 'SELECT * FROM restaurants';
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR cuisine ILIKE $${params.length})`);
    }
    if (veg === 'true') {
      conditions.push('is_pure_veg = TRUE');
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY rating DESC';

    params.push(limit, offset);
    queryText += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Single Restaurant Details
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Restaurant Menu Items
router.get('/:id/menu', async (req, res) => {
  try {
    const result = await query('SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY id ASC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
