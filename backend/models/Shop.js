const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: [true, 'Please provide a shop name'],
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    logo: {
      type: String,
      default: null,
    },
    banner: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    totalProducts: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', shopSchema);
