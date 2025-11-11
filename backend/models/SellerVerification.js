const mongoose = require('mongoose');

const sellerVerificationSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      enum: ['individual', 'company', 'partnership'],
      required: true,
    },
    businessRegistrationNumber: {
      type: String,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    ownerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    identityDocument: {
      type: {
        type: String,
        enum: ['passport', 'national_id', 'drivers_license'],
        required: true,
      },
      number: {
        type: String,
        required: true,
      },
      frontImage: {
        type: String, // URL to uploaded image
        required: true,
      },
      backImage: {
        type: String,
      },
    },
    businessDocuments: [
      {
        name: String,
        type: {
          type: String,
          enum: ['business_license', 'tax_certificate', 'bank_statement', 'other'],
        },
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bankAccount: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      bankCode: String,
      swiftCode: String,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'resubmit_required'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    notes: {
      type: String,
    },
    resubmissionCount: {
      type: Number,
      default: 0,
    },
    verificationLevel: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'basic',
    },
  },
  { timestamps: true }
);

// Index for faster queries
sellerVerificationSchema.index({ seller: 1 });
sellerVerificationSchema.index({ status: 1 });
sellerVerificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SellerVerification', sellerVerificationSchema);
