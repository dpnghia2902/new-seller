const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check query parameter (for cases like print pages opened in new window)
  else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    req.userId = decoded.id; // Keep for backward compatibility
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Check if seller is verified
const checkVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user has a shop
    if (!req.user.storeId) {
      return res.status(403).json({ 
        message: 'You need to create a shop first to perform this action',
        code: 'NO_SHOP'
      });
    }

    // Check if seller is verified
    if (!req.user.isVerified) {
      return res.status(403).json({ 
        message: 'Your seller account is pending verification. Please wait for admin approval.',
        code: 'NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if user is admin
const checkAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. This route is restricted to: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Check if user has a shop (is a seller with shop)
const requireShop = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.user.storeId) {
      return res.status(403).json({ 
        message: 'You need to create a shop first to access this feature',
        code: 'NO_SHOP'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { protect, checkVerified, checkAdmin, restrictTo, requireShop };
