const express = require('express');
const {
  createOrder,
  getMyOrders,
  getBuyerOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { orderCreateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create order with rate limiting
router.post('/', orderCreateLimiter, createOrder);

// Specific routes BEFORE wildcard routes
// Get seller's orders (orders from their shop)
router.get('/seller/my-orders', getMyOrders);

// Get buyer's orders
router.get('/buyer/my-orders', getBuyerOrders);

// Update order status (seller only)
router.patch('/:orderId/status', updateOrderStatus);

// Cancel order
router.patch('/:orderId/cancel', cancelOrder);

// Get single order (must be last because :orderId is wildcard)
router.get('/:orderId', getOrder);

module.exports = router;
