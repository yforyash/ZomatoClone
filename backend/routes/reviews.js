const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// Fetch Reviews for a Restaurant
router.get('/:restaurantId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC', [req.params.restaurantId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a New Review (and recalculate average rating)
router.post('/:restaurantId', async (req, res) => {
  try {
    const { reviewer_name, rating, comment, tags } = req.body;
    await query(
      'INSERT INTO reviews (restaurant_id, reviewer_name, rating, comment, tags) VALUES ($1, $2, $3, $4, $5)',
      [req.params.restaurantId, reviewer_name, rating, comment, tags]
    );

    // Update Average Rating in parent restaurant record
    const stats = await query('SELECT COUNT(*), AVG(rating) FROM reviews WHERE restaurant_id = $1', [req.params.restaurantId]);
    const count = parseInt(stats.rows[0].count);
    const avg = parseFloat(stats.rows[0].avg);

    await query('UPDATE restaurants SET rating = $1, rating_count = $2 WHERE id = $3', [Number(avg.toFixed(1)), count, req.params.restaurantId]);
    res.status(201).json({ count, avg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
