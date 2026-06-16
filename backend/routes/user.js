const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const authCheck = require('../middlewares/authCheck');
const _ = require('lodash');

function parseUserId(req) {
  const userId = req.headers['x-user-id'];
  return userId && userId !== 'Anonymous' ? parseInt(userId) : null;
}

// ----------------- Saved Addresses -----------------

router.get('/addresses', authCheck, async (req, res) => {
  try {
    const userId = parseUserId(req);
    if (!userId) return res.json([]);

    const result = await query(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/addresses', authCheck, async (req, res) => {
  try {
    const userId = parseUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { address_line, latitude, longitude } = req.body;
    
    const existing = await query(
      'SELECT * FROM user_addresses WHERE user_id = $1 AND address_line = $2',
      [userId, address_line]
    );
    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await query(
      `INSERT INTO user_addresses (user_id, address_line, latitude, longitude)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, address_line, latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/addresses/:id', authCheck, async (req, res) => {
  try {
    const userId = parseUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    res.json({ success: true, message: 'Address removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Favorite Restaurants -----------------

router.get('/favorites', authCheck, async (req, res) => {
  try {
    const userId = parseUserId(req);
    if (!userId) return res.json([]);

    const result = await query(
      `SELECT r.* FROM favorite_restaurants f
       JOIN restaurants r ON f.restaurant_id = r.id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/favorites', authCheck, async (req, res) => {
  try {
    const userId = parseUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { restaurant_id } = req.body;

    const existing = await query(
      'SELECT * FROM favorite_restaurants WHERE user_id = $1 AND restaurant_id = $2',
      [userId, restaurant_id]
    );

    if (existing.rows.length > 0) {
      await query(
        'DELETE FROM favorite_restaurants WHERE user_id = $1 AND restaurant_id = $2',
        [userId, restaurant_id]
      );
      res.json({ favorited: false, message: 'Removed from favorites.' });
    } else {
      await query(
        'INSERT INTO favorite_restaurants (user_id, restaurant_id) VALUES ($1, $2)',
        [userId, restaurant_id]
      );
      res.status(201).json({ favorited: true, message: 'Added to favorites.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/favorites/:restaurantId', authCheck, async (req, res) => {
  try {
    const userId = parseUserId(req);
    if (!userId) return res.json({ favorited: false });

    const result = await query(
      'SELECT * FROM favorite_restaurants WHERE user_id = $1 AND restaurant_id = $2',
      [userId, req.params.restaurantId]
    );
    res.json({ favorited: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
