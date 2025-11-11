const express = require('express');
const router = express.Router();
const { protect, restrictTo, requireShop } = require('../middleware/auth');
const verificationController = require('../controllers/verificationController');

// Seller routes - require shop instead of role
router.post('/submit', protect, requireShop, verificationController.submitVerification);
router.get('/my-verification', protect, requireShop, verificationController.getMyVerification);

// Admin routes
router.get('/', protect, restrictTo('admin'), verificationController.getAllVerifications);
router.get('/:id', protect, restrictTo('admin'), verificationController.getVerificationById);
router.put('/:id/approve', protect, restrictTo('admin'), verificationController.approveVerification);
router.put('/:id/reject', protect, restrictTo('admin'), verificationController.rejectVerification);
router.delete('/:id', protect, restrictTo('admin'), verificationController.deleteVerification);

module.exports = router;
