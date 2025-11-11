const SellerVerification = require('../models/SellerVerification');
const User = require('../models/User');
const Shop = require('../models/Shop');
const logger = require('../config/logger');
const { emitToUser, emitToShop } = require('../config/socket');

// Submit verification request
exports.submitVerification = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      businessName,
      businessType,
      businessRegistrationNumber,
      taxId,
      businessAddress,
      ownerName,
      ownerEmail,
      ownerPhone,
      identityDocument,
      businessDocuments,
      bankAccount,
      notes,
    } = req.body;

    // Check if user is a seller
    const user = await User.findById(userId);
    if (!user.storeId) {
      logger.warn('Verification attempt by non-seller', { userId });
      return res.status(400).json({ message: 'You must create a shop first' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Your account is already verified' });
    }

    // Check for existing verification
    let verification = await SellerVerification.findOne({ seller: userId });

    if (verification) {
      // If rejected or resubmit required, allow resubmission
      if (['rejected', 'resubmit_required'].includes(verification.status)) {
        verification.businessName = businessName;
        verification.businessType = businessType;
        verification.businessRegistrationNumber = businessRegistrationNumber;
        verification.taxId = taxId;
        verification.businessAddress = businessAddress;
        verification.ownerName = ownerName;
        verification.ownerEmail = ownerEmail;
        verification.ownerPhone = ownerPhone;
        verification.identityDocument = identityDocument;
        verification.businessDocuments = businessDocuments || [];
        verification.bankAccount = bankAccount;
        verification.notes = notes;
        verification.status = 'pending';
        verification.rejectionReason = null;
        verification.resubmissionCount += 1;
        
        await verification.save();
        
        logger.info('Verification resubmitted', { userId, verificationId: verification._id });
      } else {
        return res.status(400).json({ 
          message: 'You already have a pending verification request',
          status: verification.status 
        });
      }
    } else {
      // Create new verification
      verification = await SellerVerification.create({
        seller: userId,
        shop: user.storeId,
        businessName,
        businessType,
        businessRegistrationNumber,
        taxId,
        businessAddress,
        ownerName,
        ownerEmail,
        ownerPhone,
        identityDocument,
        businessDocuments: businessDocuments || [],
        bankAccount,
        notes,
        status: 'pending',
      });

      logger.info('New verification submitted', { userId, verificationId: verification._id });
    }

    // Update user status
    await User.findByIdAndUpdate(userId, {
      verificationStatus: 'pending',
      verificationSubmittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully',
      verification: {
        id: verification._id,
        status: verification.status,
        submittedAt: verification.createdAt,
      },
    });
  } catch (error) {
    logger.error('Submit verification error', { error: error.message, userId: req.userId });
    res.status(500).json({ message: 'Failed to submit verification', error: error.message });
  }
};

// Get my verification status
exports.getMyVerification = async (req, res) => {
  try {
    const userId = req.userId;

    const verification = await SellerVerification.findOne({ seller: userId })
      .populate('shop', 'shopName logo')
      .populate('reviewedBy', 'username email');

    if (!verification) {
      return res.status(404).json({ message: 'No verification request found' });
    }

    res.json({
      success: true,
      verification,
    });
  } catch (error) {
    logger.error('Get verification error', { error: error.message, userId: req.userId });
    res.status(500).json({ message: 'Failed to fetch verification', error: error.message });
  }
};

// Get all verifications (Admin only)
exports.getAllVerifications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const verifications = await SellerVerification.find(filter)
      .populate('seller', 'username email fullName')
      .populate('shop', 'shopName logo')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SellerVerification.countDocuments(filter);

    res.json({
      success: true,
      verifications,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    logger.error('Get all verifications error', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch verifications', error: error.message });
  }
};

// Get verification by ID (Admin only)
exports.getVerificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await SellerVerification.findById(id)
      .populate('seller', 'username email fullName phone avatar')
      .populate('shop', 'shopName logo banner description')
      .populate('reviewedBy', 'username email');

    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    res.json({
      success: true,
      verification,
    });
  } catch (error) {
    logger.error('Get verification by ID error', { error: error.message, verificationId: req.params.id });
    res.status(500).json({ message: 'Failed to fetch verification', error: error.message });
  }
};

// Approve verification (Admin only)
exports.approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;
    const { verificationLevel = 'standard', notes } = req.body;

    const verification = await SellerVerification.findById(id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    if (verification.status === 'approved') {
      return res.status(400).json({ message: 'Verification already approved' });
    }

    // Update verification
    verification.status = 'approved';
    verification.reviewedBy = adminId;
    verification.reviewedAt = new Date();
    verification.verificationLevel = verificationLevel;
    if (notes) verification.notes = notes;
    await verification.save();

    // Update user
    await User.findByIdAndUpdate(verification.seller, {
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
    });

    logger.info('Verification approved', { 
      verificationId: id, 
      sellerId: verification.seller,
      approvedBy: adminId 
    });

    // Send realtime notification
    try {
      emitToUser(verification.seller.toString(), 'verification-approved', {
        message: 'Your seller verification has been approved!',
        verificationLevel,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.warn('Failed to send socket notification', { error: err.message });
    }

    res.json({
      success: true,
      message: 'Verification approved successfully',
      verification,
    });
  } catch (error) {
    logger.error('Approve verification error', { error: error.message, verificationId: req.params.id });
    res.status(500).json({ message: 'Failed to approve verification', error: error.message });
  }
};

// Reject verification (Admin only)
exports.rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;
    const { rejectionReason, requireResubmit = true } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const verification = await SellerVerification.findById(id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    // Update verification
    verification.status = requireResubmit ? 'resubmit_required' : 'rejected';
    verification.reviewedBy = adminId;
    verification.reviewedAt = new Date();
    verification.rejectionReason = rejectionReason;
    await verification.save();

    // Update user
    await User.findByIdAndUpdate(verification.seller, {
      verificationStatus: 'rejected',
    });

    logger.info('Verification rejected', { 
      verificationId: id, 
      sellerId: verification.seller,
      rejectedBy: adminId,
      reason: rejectionReason 
    });

    // Send realtime notification
    try {
      emitToUser(verification.seller.toString(), 'verification-rejected', {
        message: 'Your seller verification has been rejected',
        reason: rejectionReason,
        canResubmit: requireResubmit,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.warn('Failed to send socket notification', { error: err.message });
    }

    res.json({
      success: true,
      message: 'Verification rejected',
      verification,
    });
  } catch (error) {
    logger.error('Reject verification error', { error: error.message, verificationId: req.params.id });
    res.status(500).json({ message: 'Failed to reject verification', error: error.message });
  }
};

// Delete verification (Admin only)
exports.deleteVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await SellerVerification.findByIdAndDelete(id);
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    logger.info('Verification deleted', { verificationId: id, deletedBy: req.userId });

    res.json({
      success: true,
      message: 'Verification deleted successfully',
    });
  } catch (error) {
    logger.error('Delete verification error', { error: error.message, verificationId: req.params.id });
    res.status(500).json({ message: 'Failed to delete verification', error: error.message });
  }
};
