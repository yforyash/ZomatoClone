const { query } = require('../config/db');

async function getRestaurants(search, veg, limit, offset) {
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
  return result.rows;
}

async function getRestaurantById(id) {
  const result = await query('SELECT * FROM restaurants WHERE id = $1', [id]);
  return result.rows[0];
}

async function getRestaurantMenu(restaurantId) {
  const result = await query('SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY id ASC', [restaurantId]);
  return result.rows;
}

module.exports = {
  getRestaurants,
  getRestaurantById,
  getRestaurantMenu
};
