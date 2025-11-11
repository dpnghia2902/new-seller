const User = require('../models/User');
const Shop = require('../models/Shop');

// Get all sellers (pending and verified)
exports.getAllSellers = async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'verified', or 'all'

    let filter = { storeId: { $ne: null } }; // Users with shops

    if (status === 'pending') {
      filter.isVerified = false;
    } else if (status === 'verified') {
      filter.isVerified = true;
    }

    const sellers = await User.find(filter)
      .select('-password')
      .populate('storeId', 'shopName description logo banner location createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ message: 'Failed to fetch sellers', error: error.message });
  }
};

// Verify a seller
exports.verifySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (!seller.storeId) {
      return res.status(400).json({ message: 'User does not have a shop' });
    }

    if (seller.isVerified) {
      return res.status(400).json({ message: 'Seller is already verified' });
    }

    seller.isVerified = true;
    seller.role = 'seller';
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Seller verified successfully',
      seller: {
        id: seller._id,
        username: seller.username,
        email: seller.email,
        isVerified: seller.isVerified,
        role: seller.role,
      },
    });
  } catch (error) {
    console.error('Verify seller error:', error);
    res.status(500).json({ message: 'Failed to verify seller', error: error.message });
  }
};

// Reject/Unverify a seller
exports.rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (!seller.storeId) {
      return res.status(400).json({ message: 'User does not have a shop' });
    }

    seller.isVerified = false;
    seller.role = 'buyer'; // Downgrade to buyer
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Seller verification rejected',
      reason: reason || 'No reason provided',
      seller: {
        id: seller._id,
        username: seller.username,
        email: seller.email,
        isVerified: seller.isVerified,
      },
    });
  } catch (error) {
    console.error('Reject seller error:', error);
    res.status(500).json({ message: 'Failed to reject seller', error: error.message });
  }
};

// Get platform statistics (admin dashboard)
exports.getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ storeId: { $ne: null } });
    const verifiedSellers = await User.countDocuments({ isVerified: true, storeId: { $ne: null } });
    const pendingSellers = await User.countDocuments({ isVerified: false, storeId: { $ne: null } });
    const totalShops = await Shop.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalSellers,
        verifiedSellers,
        pendingSellers,
        totalShops,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};
