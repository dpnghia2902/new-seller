const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['error', 'warn', 'info'],
      default: 'error',
    },
    errorCode: {
      type: String,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
    },
    context: {
      type: String,
      enum: ['auth', 'product', 'order', 'shop', 'coupon', 'verification', 'shipping', 'general'],
      required: true,
      index: true,
    },
    operation: {
      type: String, // e.g., 'create_product', 'update_order', 'submit_verification'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userRole: {
      type: String,
      enum: ['buyer', 'seller', 'admin', 'guest'],
    },
    requestDetails: {
      method: String,
      url: String,
      params: mongoose.Schema.Types.Mixed,
      body: mongoose.Schema.Types.Mixed,
      query: mongoose.Schema.Types.Mixed,
      headers: mongoose.Schema.Types.Mixed,
      ip: String,
      userAgent: String,
    },
    responseDetails: {
      statusCode: Number,
      responseTime: Number, // in ms
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Additional context-specific data
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ level: 1, createdAt: -1 });
errorLogSchema.index({ context: 1, createdAt: -1 });
errorLogSchema.index({ userId: 1, createdAt: -1 });
errorLogSchema.index({ resolved: 1, createdAt: -1 });

// TTL index to auto-delete old logs after 90 days
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('ErrorLog', errorLogSchema);
