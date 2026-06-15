const restaurantService = require('../services/restaurantService');
const externalZomatoService = require('../services/externalZomatoService');

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
    const menuItems = await restaurantService.getRestaurantMenu(req.params.id);
    res.json(menuItems);
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
  importExternalRestaurants
};
