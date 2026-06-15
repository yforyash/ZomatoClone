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

async function insertRestaurant(data) {
  const existing = await query('SELECT * FROM restaurants WHERE name = $1', [data.name]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await query(
    `INSERT INTO restaurants (name, cuisine, rating, rating_count, cost_for_two, delivery_time, image_url, is_pure_veg, latitude, longitude, address, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      data.name,
      data.cuisine,
      data.rating,
      data.rating_count,
      data.cost_for_two,
      data.delivery_time,
      data.image_url,
      data.is_pure_veg,
      data.latitude,
      data.longitude,
      data.address,
      data.phone
    ]
  );
  return result.rows[0];
}

async function insertMenuItem(item) {
  const existing = await query('SELECT * FROM menu_items WHERE restaurant_id = $1 AND name = $2', [item.restaurant_id, item.name]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await query(
    `INSERT INTO menu_items (restaurant_id, name, price, category, is_veg, is_bestseller, image_url, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      item.restaurant_id,
      item.name,
      item.price,
      item.category,
      item.is_veg,
      item.is_bestseller,
      item.image_url,
      item.description
    ]
  );
  return result.rows[0];
}

async function updateRestaurantRating(id, rating, count) {
  await query('UPDATE restaurants SET rating = $1, rating_count = $2 WHERE id = $3', [rating, count, id]);
}

module.exports = {
  getRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  insertRestaurant,
  insertMenuItem,
  updateRestaurantRating
};
