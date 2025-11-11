const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCoupon,
  getMyCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');

// Protected routes (require authentication)
router.post('/', protect, createCoupon);
router.get('/my-coupons', protect, getMyCoupons);
router.get('/:id', protect, getCoupon);
router.put('/:id', protect, updateCoupon);
router.delete('/:id', protect, deleteCoupon);
router.post('/validate', protect, validateCoupon);

module.exports = router;
