const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
    },
    fullName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compare password (without hashing)
userSchema.methods.matchPassword = function (enteredPassword) {
  return enteredPassword === this.password;
};

module.exports = mongoose.model('User', userSchema);
