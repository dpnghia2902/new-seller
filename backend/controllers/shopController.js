const Shop = require('../models/Shop');
const User = require('../models/User');
const Product = require('../models/Product');

// Create shop (Become a seller)
exports.createShop = async (req, res) => {
  try {
    const { shopName, description, logo, banner, location } = req.body;

    // Validate
    if (!shopName) {
      return res.status(400).json({ message: 'Please provide shop name' });
    }

    // Check if shop name already exists
    const existingShop = await Shop.findOne({ shopName });
    if (existingShop) {
      return res.status(400).json({ message: 'Shop name already exists' });
    }

    // Check if user already has a shop
    const user = await User.findById(req.userId);
    if (user.storeId) {
      return res.status(400).json({ message: 'You already have a shop' });
    }

    // Create shop
    const shop = await Shop.create({
      shopName,
      owner: req.userId,
      description: description || '',
      logo: logo || null,
      banner: banner || null,
      location: location || null,
    });

    // Update user with shop id
    await User.findByIdAndUpdate(req.userId, { storeId: shop._id });

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        owner: shop.owner,
        description: shop.description,
        logo: shop.logo,
        banner: shop.banner,
        location: shop.location,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my shop
exports.getMyShop = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.storeId) {
      return res.status(404).json({ message: 'You do not have a shop' });
    }

    const shop = await Shop.findById(user.storeId).populate('owner', 'username email');
    const products = await Product.find({ shop: shop._id });

    res.status(200).json({
      success: true,
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        owner: shop.owner,
        description: shop.description,
        logo: shop.logo,
        banner: shop.banner,
        location: shop.location,
        rating: shop.rating,
        followers: shop.followers.length,
        productCount: products.length,
        createdAt: shop.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shop by id
exports.getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)
      .populate('owner', 'username email')
      .populate({
        path: 'owner',
        select: 'username email avatar',
      });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const products = await Product.find({ shop: shop._id, isActive: true });

    res.status(200).json({
      success: true,
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        owner: shop.owner,
        description: shop.description,
        logo: shop.logo,
        banner: shop.banner,
        rating: shop.rating,
        followersCount: shop.followers.length,
        productCount: products.length,
        createdAt: shop.createdAt,
      },
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update shop
exports.updateShop = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.storeId) {
      return res.status(404).json({ message: 'You do not have a shop' });
    }

    const { shopName, description, logo, banner, location } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      user.storeId,
      { shopName, description, logo, banner, location },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Shop updated successfully',
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        description: shop.description,
        logo: shop.logo,
        banner: shop.banner,
        location: shop.location,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all shops
exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({ isActive: true }).populate(
      'owner',
      'username email'
    );

    res.status(200).json({
      success: true,
      count: shops.length,
      shops,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
