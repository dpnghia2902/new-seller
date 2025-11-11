const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      required: true,
    },
    images: [String],
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Middleware to automatically set isActive based on stock
// Before saving (create or update)
productSchema.pre('save', function (next) {
  // If stock is 0, set isActive to false
  if (this.stock === 0) {
    this.isActive = false;
  }
  // If stock > 0, set isActive to true
  else if (this.stock > 0) {
    this.isActive = true;
  }
  next();
});

// Middleware for findOneAndUpdate, updateOne, updateMany
productSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate();
  
  // Check if stock is being updated
  if (update.$set && typeof update.$set.stock !== 'undefined') {
    if (update.$set.stock === 0) {
      update.$set.isActive = false;
    } else if (update.$set.stock > 0) {
      update.$set.isActive = true;
    }
  } else if (typeof update.stock !== 'undefined') {
    if (update.stock === 0) {
      update.isActive = false;
    } else if (update.stock > 0) {
      update.isActive = true;
    }
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);
