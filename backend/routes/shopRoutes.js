const express = require('express');
const {
  createShop,
  getMyShop,
  getShop,
  updateShop,
  getAllShops,
} = require('../controllers/shopController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create', protect, createShop);
router.get('/my-shop', protect, getMyShop);
router.get('/all', getAllShops);
router.get('/:shopId', getShop);
router.put('/update', protect, updateShop);

module.exports = router;
