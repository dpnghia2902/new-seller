const express = require('express');
const router = express.Router();
const { protect, requireShop } = require('../middleware/auth');
const shippingController = require('../controllers/shippingController');

// Seller routes - require shop instead of role
router.get('/label/:orderId', protect, requireShop, shippingController.getShippingLabel);
router.get('/label/:orderId/print', protect, requireShop, shippingController.printShippingLabel);

module.exports = router;
