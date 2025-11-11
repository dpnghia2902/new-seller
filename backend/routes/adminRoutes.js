const express = require('express');
const {
  getAllSellers,
  verifySeller,
  rejectSeller,
  getPlatformStats,
} = require('../controllers/adminController');
const { protect, checkAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(checkAdmin);

// Get all sellers
router.get('/sellers', getAllSellers);

// Get platform statistics
router.get('/stats', getPlatformStats);

// Verify a seller
router.patch('/sellers/:sellerId/verify', verifySeller);

// Reject/Unverify a seller
router.patch('/sellers/:sellerId/reject', rejectSeller);

module.exports = router;
