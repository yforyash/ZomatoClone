const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authCheck = require('../middlewares/authCheck');

router.post('/', authCheck, orderController.createOrder);
router.post('/create-checkout-session', authCheck, orderController.createCheckoutSession);
router.post('/confirm-payment', authCheck, orderController.confirmPayment);
router.post('/create-razorpay-order', authCheck, orderController.createRazorpayOrder);
router.post('/verify-razorpay-payment', authCheck, orderController.verifyRazorpayPayment);
router.get('/', authCheck, orderController.getOrders);
router.get('/:id/track', orderController.trackOrder);

// Dashboard routes
router.get('/restaurant-stats', authCheck, orderController.getRestaurantDashboardStats);
router.post('/withdraw', authCheck, orderController.withdrawEarnings);
router.get('/admin-stats', authCheck, orderController.getAdminDashboardStats);

module.exports = router;
