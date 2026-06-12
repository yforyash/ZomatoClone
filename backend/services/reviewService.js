const { query } = require('../config/db');

async function getReviewsByRestaurantId(restaurantId) {
  const result = await query('SELECT * FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC', [restaurantId]);
  return result.rows;
}

async function insertReview(restaurantId, reviewerName, rating, comment, tags) {
  await query(
    'INSERT INTO reviews (restaurant_id, reviewer_name, rating, comment, tags) VALUES ($1, $2, $3, $4, $5)',
    [restaurantId, reviewerName, rating, comment, tags]
  );
}

async function updateRestaurantRatingStats(restaurantId) {
  const statsResult = await query(
    'SELECT COUNT(*), AVG(rating) FROM reviews WHERE restaurant_id = $1',
    [restaurantId]
  );
  
  const count = parseInt(statsResult.rows[0].count);
  const avg = parseFloat(statsResult.rows[0].avg);
  
  await query(
    'UPDATE restaurants SET rating = $1, rating_count = $2 WHERE id = $3',
    [Number(avg.toFixed(1)), count, restaurantId]
  );
  
  return { count, avg };
}

module.exports = {
  getReviewsByRestaurantId,
  insertReview,
  updateRestaurantRatingStats
};
