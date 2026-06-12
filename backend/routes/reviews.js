const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/:restaurantId', reviewController.getRestaurantReviews);
router.post('/:restaurantId', reviewController.createRestaurantReview);

module.exports = router;
