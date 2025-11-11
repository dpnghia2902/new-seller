const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// Create review
exports.createReview = async (req, res) => {
    try {
        const { productId, orderId, rating, comment, images } = req.body;
        const buyerId = req.user._id;

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if order exists and is delivered
        const order = await Order.findById(orderId).populate('shop');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.buyer.toString() !== buyerId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Can only review delivered orders' });
        }

        // Check if product is in order
        const orderItem = order.items.find(
            (item) => item.product.toString() === productId
        );
        if (!orderItem) {
            return res.status(400).json({ message: 'Product not in this order' });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            product: productId,
            order: orderId,
            buyer: buyerId,
        });

        if (existingReview) {
            return res.status(400).json({ message: 'Already reviewed this product' });
        }

        // Create review
        const review = new Review({
            product: productId,
            order: orderId,
            buyer: buyerId,
            shop: order.shop._id,
            rating,
            comment,
            images: images || [],
            isVerifiedPurchase: true,
        });

        await review.save();

        // Update product rating
        await updateProductRating(productId);

        // Update shop rating
        await updateShopRating(order.shop._id);

        await review.populate([
            { path: 'buyer', select: 'fullName username' },
            { path: 'product', select: 'title images' },
        ]);

        res.status(201).json({
            message: 'Review created successfully',
            review,
        });
    } catch (err) {
        console.error('Create review error:', err);
        res.status(500).json({ message: 'Failed to create review' });
    }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sort = 'recent' } = req.query;

        let sortOption = { createdAt: -1 }; // recent
        if (sort === 'helpful') sortOption = { helpfulVotes: -1 };
        if (sort === 'rating-high') sortOption = { rating: -1 };
        if (sort === 'rating-low') sortOption = { rating: 1 };

        const reviews = await Review.find({ product: productId })
            .populate('buyer', 'fullName username')
            .sort(sortOption)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Review.countDocuments({ product: productId });

        // Calculate rating distribution
        const ratingStats = await Review.aggregate([
            { $match: { product: mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 },
                },
            },
        ]);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingStats.forEach((stat) => {
            distribution[stat._id] = stat.count;
        });

        // Calculate average rating
        const avgRating = await Review.aggregate([
            { $match: { product: mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        res.json({
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
            stats: {
                avgRating: avgRating[0]?.avgRating || 0,
                totalReviews: avgRating[0]?.totalReviews || 0,
                distribution,
            },
        });
    } catch (err) {
        console.error('Get product reviews error:', err);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

// Get shop reviews
exports.getShopReviews = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find({ shop: shopId })
            .populate('buyer', 'fullName username')
            .populate('product', 'title images')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments({ shop: shopId });

        res.json({
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Get shop reviews error:', err);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

// Get buyer's reviews
exports.getBuyerReviews = async (req, res) => {
    try {
        const buyerId = req.user._id;

        const reviews = await Review.find({ buyer: buyerId })
            .populate('product', 'title images')
            .populate('shop', 'shopName')
            .sort({ createdAt: -1 });

        res.json({ reviews });
    } catch (err) {
        console.error('Get buyer reviews error:', err);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

// Get seller's received reviews
exports.getSellerReviews = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Find seller's shop
        const shop = await Shop.findOne({ owner: sellerId });
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        const reviews = await Review.find({ shop: shop._id })
            .populate('buyer', 'fullName username')
            .populate('product', 'title images')
            .sort({ createdAt: -1 });

        res.json({ reviews });
    } catch (err) {
        console.error('Get seller reviews error:', err);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

// Update review
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment, images } = req.body;
        const buyerId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.buyer.toString() !== buyerId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update fields
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (images) review.images = images;

        await review.save();

        // Update product rating
        await updateProductRating(review.product);

        // Update shop rating
        await updateShopRating(review.shop);

        await review.populate([
            { path: 'buyer', select: 'fullName username' },
            { path: 'product', select: 'title images' },
        ]);

        res.json({ message: 'Review updated successfully', review });
    } catch (err) {
        console.error('Update review error:', err);
        res.status(500).json({ message: 'Failed to update review' });
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const buyerId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.buyer.toString() !== buyerId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const productId = review.product;
        const shopId = review.shop;

        await review.deleteOne();

        // Update product rating
        await updateProductRating(productId);

        // Update shop rating
        await updateShopRating(shopId);

        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Delete review error:', err);
        res.status(500).json({ message: 'Failed to delete review' });
    }
};

// Respond to review (seller only)
exports.respondToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { comment } = req.body;
        const sellerId = req.user._id;

        const review = await Review.findById(reviewId).populate('shop');
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user is the shop owner
        if (review.shop.owner.toString() !== sellerId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        review.sellerResponse = {
            comment,
            respondedAt: new Date(),
        };

        await review.save();

        await review.populate([
            { path: 'buyer', select: 'fullName username' },
            { path: 'product', select: 'title images' },
        ]);

        res.json({ message: 'Response added successfully', review });
    } catch (err) {
        console.error('Respond to review error:', err);
        res.status(500).json({ message: 'Failed to respond to review' });
    }
};

// Vote review as helpful
exports.voteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if already voted
        const hasVoted = review.votedBy.includes(userId);

        if (hasVoted) {
            // Remove vote
            review.votedBy = review.votedBy.filter(
                (id) => id.toString() !== userId.toString()
            );
            review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
        } else {
            // Add vote
            review.votedBy.push(userId);
            review.helpfulVotes += 1;
        }

        await review.save();

        res.json({
            message: hasVoted ? 'Vote removed' : 'Vote added',
            helpfulVotes: review.helpfulVotes,
            hasVoted: !hasVoted,
        });
    } catch (err) {
        console.error('Vote review error:', err);
        res.status(500).json({ message: 'Failed to vote review' });
    }
};

// Helper function to update product rating
async function updateProductRating(productId) {
    const reviews = await Review.find({ product: productId });
    if (reviews.length === 0) {
        await Product.findByIdAndUpdate(productId, { rating: 0 });
        return;
    }

    const avgRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
        rating: Math.round(avgRating * 10) / 10,
    });
}

// Helper function to update shop rating
async function updateShopRating(shopId) {
    const reviews = await Review.find({ shop: shopId });
    if (reviews.length === 0) {
        await Shop.findByIdAndUpdate(shopId, { rating: 0 });
        return;
    }

    const avgRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await Shop.findByIdAndUpdate(shopId, {
        rating: Math.round(avgRating * 10) / 10,
    });
}