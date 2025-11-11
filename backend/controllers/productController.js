const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');

// Create product (seller only)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock, images, discount, originalPrice } =
      req.body;

    // Validate
    if (!title || !description || !price || !category || stock === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Get user's shop
    const user = await User.findById(req.userId);
    if (!user.storeId) {
      return res.status(400).json({ message: 'You do not have a shop' });
    }

    // Create product
    const product = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      images: images || [],
      discount: discount || 0,
      originalPrice: originalPrice || price,
      shop: user.storeId,
    });

    // Update shop product count
    await Shop.findByIdAndUpdate(user.storeId, {
      $inc: { totalProducts: 1 },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my products (seller)
exports.getMyProducts = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.storeId) {
      return res.status(400).json({ message: 'You do not have a shop' });
    }

    const products = await Product.find({ shop: user.storeId });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all products (home page)
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;

    let filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .populate('shop', 'shopName logo owner')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('shop')
      .populate('reviews.user', 'username avatar');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is owner
    const user = await User.findById(req.userId);
    if (product.shop.toString() !== user.storeId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    product = await Product.findByIdAndUpdate(req.params.productId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is owner
    const user = await User.findById(req.userId);
    if (product.shop.toString() !== user.storeId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndRemove(req.params.productId);

    // Update shop product count
    await Shop.findByIdAndUpdate(user.storeId, {
      $inc: { totalProducts: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products by shop
exports.getShopProducts = async (req, res) => {
  try {
    const products = await Product.find({
      shop: req.params.shopId,
      isActive: true,
    }).populate('shop', 'shopName logo');

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
