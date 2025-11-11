const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
      unique: true, // one complaint per order
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderCode: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['damaged_product', 'wrong_item', 'missing_item', 'late_delivery', 'other'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'disputed'],
      default: 'new',
      index: true,
    },
    // Seller decision/resolution
    resolution: {
      action: {
        type: String,
        enum: ['refund', 'replace', 'reject', null],
        default: null,
      },
      refundAmount: {
        type: Number,
        default: null,
        min: 0,
      },
      refundPercentage: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      note: {
        type: String,
        default: '',
        trim: true,
      },
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      decidedAt: {
        type: Date,
        default: null,
      },
    },
    evidenceImages: [
      {
        type: String,
      },
    ],
    // Seller provided evidences when rejecting a complaint
    sellerEvidence: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

// Helpful compound index for list pages
ComplaintSchema.index({ shop: 1, status: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);


