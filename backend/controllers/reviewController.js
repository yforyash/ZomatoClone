const reviewService = require('../services/reviewService');

async function getRestaurantReviews(req, res) {
  try {
    const reviews = await reviewService.getReviewsByRestaurantId(req.params.restaurantId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createRestaurantReview(req, res) {
  try {
    const { reviewer_name, rating, comment, tags } = req.body;
    const { restaurantId } = req.params;

    await reviewService.insertReview(restaurantId, reviewer_name, rating, comment, tags);
    const ratingStats = await reviewService.updateRestaurantRatingStats(restaurantId);
    
    res.status(201).json(ratingStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getRestaurantReviews,
  createRestaurantReview
};
