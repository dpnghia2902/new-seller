const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Create review (buyer only, after delivered order)
router.post('/', protect, reviewController.createReview);

// Get product reviews
router.get('/product/:productId', reviewController.getProductReviews);

// Get shop reviews
router.get('/shop/:shopId', reviewController.getShopReviews);

// Get buyer's reviews
router.get('/buyer/my-reviews', protect, reviewController.getBuyerReviews);

// Get seller's received reviews
router.get('/seller/my-reviews', protect, reviewController.getSellerReviews);

// Update review (buyer only)
router.put('/:reviewId', protect, reviewController.updateReview);

// Delete review (buyer only)
router.delete('/:reviewId', protect, reviewController.deleteReview);

// Seller responds to review
router.post('/:reviewId/respond', protect, reviewController.respondToReview);

// Vote review as helpful
router.post('/:reviewId/vote', protect, reviewController.voteReview);

module.exports = router;