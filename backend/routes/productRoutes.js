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
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create', protect, createProduct);
router.get('/my-products', protect, getMyProducts);
router.get('/all', getAllProducts);
router.get('/shop/:shopId', getShopProducts);
router.get('/:productId', getProduct);
router.put('/:productId', protect, updateProduct);
router.delete('/:productId', protect, deleteProduct);

module.exports = router;
