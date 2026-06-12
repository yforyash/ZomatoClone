const restaurantService = require('../services/restaurantService');

async function getAllRestaurants(req, res) {
  try {
    const { search, veg } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    await new Promise(resolve => setTimeout(resolve, 1500));

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

module.exports = {
  getAllRestaurants,
  getRestaurant,
  getRestaurantMenu
};
