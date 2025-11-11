const Coupon = require('../models/Coupon');

// Create coupon
const createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, startDate, endDate, usageLimit, applicableProducts } = req.body;
    
    // Check if shop exists
    const shopId = req.user.storeId;
    if (!shopId) {
      return res.status(403).json({ message: 'You must be a seller to create coupons' });
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
    }

    // Check if code already exists for this shop
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase(), shop: shopId });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      startDate,
      endDate,
      usageLimit: usageLimit || null,
      shop: shopId,
      applicableProducts: applicableProducts || []
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all coupons for shop
const getMyCoupons = async (req, res) => {
  try {
    const shopId = req.user.storeId;
    if (!shopId) {
      return res.status(403).json({ message: 'You must be a seller to view coupons' });
    }

    const coupons = await Coupon.find({ shop: shopId })
      .populate('applicableProducts', 'title images')
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single coupon
const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('applicableProducts', 'title images price');

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if user owns this coupon's shop
    if (coupon.shop.toString() !== req.user.storeId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(coupon);
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update coupon
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if user owns this coupon's shop
    if (coupon.shop.toString() !== req.user.storeId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { code, description, discountType, discountValue, minPurchase, maxDiscount, startDate, endDate, usageLimit, applicableProducts, isActive } = req.body;

    // Validate discount value if provided
    if (discountType === 'percentage' && discountValue && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
    }

    // Check if new code conflicts with existing coupons
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: code.toUpperCase(), 
        shop: req.user.storeId,
        _id: { $ne: coupon._id }
      });
      if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }

    // Update fields
    if (code) coupon.code = code.toUpperCase();
    if (description) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (startDate) coupon.startDate = startDate;
    if (endDate) coupon.endDate = endDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (applicableProducts !== undefined) coupon.applicableProducts = applicableProducts;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    const updatedCoupon = await Coupon.findById(coupon._id)
      .populate('applicableProducts', 'title images');

    res.json(updatedCoupon);
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if user owns this coupon's shop
    if (coupon.shop.toString() !== req.user.storeId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Validate coupon for order
const validateCoupon = async (req, res) => {
  try {
    const { code, shopId, productIds, totalPrice } = req.body;

    // Validate input
    if (!code || !shopId || !totalPrice) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs are required' });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      shop: shopId,
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // Check if coupon is expired
    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return res.status(400).json({ message: 'Coupon has expired or not yet active' });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Check minimum purchase
    if (totalPrice < coupon.minPurchase) {
      return res.status(400).json({ 
        message: `Minimum purchase of $${coupon.minPurchase} required` 
      });
    }

    // Check if products are applicable
    if (coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds.some(productId => 
        coupon.applicableProducts.some(ap => ap.toString() === productId.toString())
      );

      if (!hasApplicableProduct) {
        return res.status(400).json({ 
          message: 'This coupon is not applicable to the selected product(s)' 
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (totalPrice * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, totalPrice);

    res.json({
      valid: true,
      discount,
      finalPrice: totalPrice - discount,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    
    // Return user-friendly error messages
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product or shop ID' });
    }
    
    res.status(500).json({ 
      message: 'An error occurred while validating the coupon. Please try again.' 
    });
  }
};

module.exports = {
  createCoupon,
  getMyCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};
