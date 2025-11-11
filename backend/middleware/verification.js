const User = require('../models/User');
const logger = require('../config/logger');

// Middleware to check if seller is verified
exports.requireVerification = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.storeId) {
      return res.status(403).json({ 
        message: 'You must create a shop first',
        code: 'NO_SHOP' 
      });
    }

    if (!user.isVerified) {
      logger.warn('Unverified seller attempted restricted action', { 
        userId, 
        action: req.path,
        verificationStatus: user.verificationStatus 
      });

      return res.status(403).json({
        message: 'Your seller account must be verified to perform this action',
        code: 'NOT_VERIFIED',
        verificationStatus: user.verificationStatus,
        hint: user.verificationStatus === 'unverified' 
          ? 'Please submit your verification documents'
          : user.verificationStatus === 'pending'
          ? 'Your verification is under review. Please wait for approval.'
          : 'Your verification was rejected. Please check your verification status for details.',
      });
    }

    next();
  } catch (error) {
    logger.error('Verification middleware error', { error: error.message, userId: req.userId });
    res.status(500).json({ message: 'Error checking verification status' });
  }
};

// Optional verification check - adds verification status but doesn't block
exports.checkVerification = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (user) {
      req.isVerified = user.isVerified || false;
      req.verificationStatus = user.verificationStatus || 'unverified';
    }

    next();
  } catch (error) {
    logger.error('Check verification error', { error: error.message, userId: req.userId });
    next(); // Don't block on error
  }
};
