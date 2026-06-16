const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

router.get('/', restaurantController.getAllRestaurants);
router.post('/import-external', restaurantController.importExternalRestaurants);
router.post('/create', restaurantController.createRestaurant);
router.post('/:id/claim', restaurantController.claimRestaurant);
router.post('/:id/dishes', restaurantController.addRestaurantDish);
router.get('/:id', restaurantController.getRestaurant);
router.get('/:id/menu', restaurantController.getRestaurantMenu);

module.exports = router;
