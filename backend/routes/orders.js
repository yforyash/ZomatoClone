const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authCheck = require('../middlewares/authCheck');

router.post('/', authCheck, orderController.createOrder);
router.get('/', authCheck, orderController.getOrders);
router.get('/:id/track', orderController.trackOrder);

module.exports = router;
