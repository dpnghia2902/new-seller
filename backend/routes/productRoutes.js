const express = require('express');
const {
  createProduct,
  getMyProducts,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getShopProducts,
} = require('../controllers/productController');
const { protect, checkVerified } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');
const { productCreateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/create', protect, checkVerified, requireVerification, productCreateLimiter, createProduct);
router.get('/my-products', protect, getMyProducts);
router.get('/all', getAllProducts);
router.get('/shop/:shopId', getShopProducts);
router.get('/:productId', getProduct);
router.put('/:productId', protect, checkVerified, requireVerification, updateProduct);
router.delete('/:productId', protect, checkVerified, deleteProduct);

module.exports = router;
