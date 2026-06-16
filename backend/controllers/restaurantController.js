const restaurantService = require('../services/restaurantService');
const externalZomatoService = require('../services/externalZomatoService');
const { query } = require('../config/db');

async function getAllRestaurants(req, res) {
  try {
    const { search, veg } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    await new Promise(resolve => setTimeout(resolve, 800));

    const restaurantsList = await restaurantService.getRestaurants(search, veg, limit, offset);
    res.json(restaurantsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getRestaurant(req, res) {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getRestaurantMenu(req, res) {
  try {
    const restaurantId = parseInt(req.params.id);
    const userId = req.headers['x-user-id'];
    let includeUnapproved = false;

    if (userId && userId !== 'Anonymous') {
      const userRes = await query('SELECT role, restaurant_id FROM users WHERE id = $1', [parseInt(userId)]);
      const user = userRes.rows[0];
      if (user && (user.role === 'admin' || (user.role === 'restaurant' && user.restaurant_id === restaurantId))) {
        includeUnapproved = true;
      }
    }

    const menuItems = await restaurantService.getRestaurantMenu(restaurantId, includeUnapproved);
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addRestaurantDish(req, res) {
  try {
    const restaurantId = parseInt(req.params.id);
    const userId = req.headers['x-user-id'];
    
    if (!userId || userId === 'Anonymous') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRes = await query('SELECT role, restaurant_id FROM users WHERE id = $1', [parseInt(userId)]);
    const user = userRes.rows[0];

    if (!user || user.role !== 'restaurant' || user.restaurant_id !== restaurantId) {
      return res.status(403).json({ error: 'Access denied: You do not own this restaurant.' });
    }

    const { name, owner_price, category, is_veg, description } = req.body;
    if (!name || !owner_price || !category) {
      return res.status(400).json({ error: 'Name, owner price, and category are required.' });
    }

    const { getFoodImageByName } = require('../config/imageMapper');
    const image_url = getFoodImageByName(name, category);
    
    const price = Math.round(parseFloat(owner_price) * 1.10);
    
    const result = await query(
      `INSERT INTO menu_items (restaurant_id, name, price, owner_price, category, is_veg, is_bestseller, description, image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8, 'pending') RETURNING *`,
      [restaurantId, name, price, parseFloat(owner_price), category, is_veg, description || '', image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function claimRestaurant(req, res) {
  try {
    const restaurantId = parseInt(req.params.id);
    const userId = req.headers['x-user-id'];

    if (!userId || userId === 'Anonymous') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRes = await query('SELECT role FROM users WHERE id = $1', [parseInt(userId)]);
    const user = userRes.rows[0];

    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ error: 'Access denied: Only restaurant owners can claim restaurants.' });
    }

    await query('UPDATE users SET restaurant_id = $1 WHERE id = $2', [restaurantId, parseInt(userId)]);
    
    res.json({ success: true, message: 'Restaurant claimed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createRestaurant(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId || userId === 'Anonymous') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRes = await query('SELECT role FROM users WHERE id = $1', [parseInt(userId)]);
    const user = userRes.rows[0];

    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ error: 'Access denied: Only restaurant owners can create restaurants.' });
    }

    const { name, cuisine, address, phone, is_pure_veg, image_url } = req.body;
    if (!name || !cuisine || !address || !phone) {
      return res.status(400).json({ error: 'Name, cuisine, address, and phone are required.' });
    }

    const img = image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&auto=format&fit=crop&q=80';

    const restRes = await query(
      `INSERT INTO restaurants (name, cuisine, rating, rating_count, cost_for_two, delivery_time, image_url, is_pure_veg, latitude, longitude, address, phone)
       VALUES ($1, $2, 4.0, 1, 500, 25, $3, $4, 28.6139, 77.2090, $5, $6) RETURNING *`,
      [name, cuisine, img, is_pure_veg || false, address, phone]
    );

    const newRest = restRes.rows[0];

    await query('UPDATE users SET restaurant_id = $1 WHERE id = $2', [newRest.id, parseInt(userId)]);

    res.status(201).json({ success: true, restaurant: newRest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function importExternalRestaurants(req, res) {
  try {
    const list = await externalZomatoService.fetchAndMapZomatoRestaurants();
    const imported = [];

    for (const data of list) {
      const inserted = await restaurantService.insertRestaurant(data);
      imported.push(inserted);

      const items = [
        {
          restaurant_id: inserted.id,
          name: 'Special Veg Thali',
          price: 299.00,
          category: 'Main Course',
          is_veg: true,
          is_bestseller: true,
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
          description: 'A traditional Indian thali with paneer, dal, rice, roti, and dessert.'
        },
        {
          restaurant_id: inserted.id,
          name: 'Crispy Garlic Naan',
          price: 60.00,
          category: 'Breads',
          is_veg: true,
          is_bestseller: false,
          image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500',
          description: 'Clay-oven baked flatbread seasoned with garlic and butter.'
        }
      ];

      for (const item of items) {
        await restaurantService.insertMenuItem(item);
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${imported.length} restaurants successfully`,
      data: imported
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllRestaurants,
  getRestaurant,
  getRestaurantMenu,
  importExternalRestaurants,
  addRestaurantDish,
  claimRestaurant,
  createRestaurant
};
