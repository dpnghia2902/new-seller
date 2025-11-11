const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        images: [{
            type: String,
        }],
        // Seller response
        sellerResponse: {
            comment: {
                type: String,
                trim: true,
            },
            respondedAt: {
                type: Date,
            },
        },
        // Verification
        isVerifiedPurchase: {
            type: Boolean,
            default: true,
        },
        // Helpful votes
        helpfulVotes: {
            type: Number,
            default: 0,
        },
        votedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
reviewSchema.index({ product: 1, buyer: 1 });
reviewSchema.index({ shop: 1 });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);