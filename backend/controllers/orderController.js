const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Coupon = require('../models/Coupon');

// Create order
exports.createOrder = async (req, res) => {
  try {
    let { shopId, items, totalPrice, originalPrice, discount, couponCode, shippingAddress, notes } = req.body;
    const buyerId = req.user._id;

    console.log('Creating order with data:', { shopId, items, totalPrice, originalPrice, discount, couponCode, buyerId });

    // Validate shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      console.log('Shop not found with ID:', shopId);
      return res.status(404).json({ message: 'Shop not found' });
    }

    console.log('Shop found:', shop.shopName);

    let couponUsed = null;
    let couponSnapshot = null;
    let actualDiscount = 0;
    let actualOriginalPrice = null;
    let actualTotalPrice = totalPrice;

    // If coupon code is provided, validate and apply it
    if (couponCode) {
      console.log('Looking for coupon:', couponCode, 'in shop:', shopId);
      
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(), 
        shop: shopId,
        isActive: true 
      });

      console.log('Coupon found:', coupon ? coupon.code : 'NOT FOUND');

      if (coupon) {
        // Check if coupon is valid for the products
        const productIds = items.map(item => item.productId.toString());
        console.log('Product IDs:', productIds);
        console.log('Coupon applicable products:', coupon.applicableProducts);
        
        const isApplicable = coupon.applicableProducts.length === 0 || 
                            productIds.some(pid => coupon.applicableProducts.map(p => p.toString()).includes(pid));

        console.log('Is coupon applicable?', isApplicable);

        if (isApplicable) {
          // Verify discount calculation
          const calculatedOriginalPrice = originalPrice || totalPrice;
          let calculatedDiscount = 0;
          
          if (coupon.discountType === 'percentage') {
            calculatedDiscount = (calculatedOriginalPrice * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
              calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
            }
          } else {
            calculatedDiscount = coupon.discountValue;
          }

          // Update coupon usage
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await coupon.save();

          couponUsed = coupon._id;
          couponSnapshot = {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
          };
          
          actualOriginalPrice = calculatedOriginalPrice;
          actualDiscount = calculatedDiscount;
          actualTotalPrice = Math.max(0, calculatedOriginalPrice - calculatedDiscount);
          
          console.log('✅ Coupon applied successfully:', {
            code: couponCode,
            originalPrice: actualOriginalPrice,
            discount: actualDiscount,
            totalPrice: actualTotalPrice,
            couponSnapshot
          });
        } else {
          console.log('❌ Coupon not applicable to products - ignoring coupon');
          // Reset to no coupon
          actualOriginalPrice = null;
          actualDiscount = 0;
          actualTotalPrice = originalPrice || totalPrice;
        }
      } else {
        console.log('❌ Coupon not found or inactive - ignoring coupon');
        // Reset to no coupon
        actualOriginalPrice = null;
        actualDiscount = 0;
        actualTotalPrice = originalPrice || totalPrice;
      }
    } else {
      console.log('No coupon code provided');
    }

    const order = new Order({
      buyer: buyerId,
      shop: shopId,
      items: items.map((item) => ({
        product: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: actualTotalPrice,
      originalPrice: actualOriginalPrice,
      discount: actualDiscount,
      couponUsed: couponUsed,
      coupon: couponSnapshot,
      shippingAddress,
      notes,
    });

    console.log('Order data before save:', {
      totalPrice: order.totalPrice,
      originalPrice: order.originalPrice,
      discount: order.discount,
      coupon: order.coupon,
      couponUsed: order.couponUsed
    });

    await order.save();
    console.log('✅ Order saved with ID:', order._id);
    
    await order.populate(['buyer', 'shop', 'items.product', 'couponUsed']);

    console.log('Order after populate:', {
      _id: order._id,
      coupon: order.coupon,
      discount: order.discount,
      originalPrice: order.originalPrice,
      totalPrice: order.totalPrice
    });

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

// Get my orders (for seller - orders from their shop)
exports.getMyOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    console.log('Getting orders for seller:', sellerId);

    // Find seller's shop
    const shop = await Shop.findOne({ owner: sellerId });
    console.log('Shop found:', shop);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Get all orders for this shop
    const orders = await Order.find({ shop: shop._id })
      .populate('buyer', 'fullName email username phone')
      .populate('shop', 'shopName logo')
      .populate('items.product', 'title price')
      .populate('couponUsed', 'code discountType discountValue')
      .sort({ createdAt: -1 });

    console.log('Orders found:', orders.length);
    res.json({ orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

// Get buyer's orders
exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user._id;

    const orders = await Order.find({ buyer: buyerId })
      .populate('shop', 'shopName logo')
      .populate('items.product', 'title price images')
      .populate('couponUsed', 'code discountType discountValue')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error('Get buyer orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'fullName email phone username')
      .populate('shop', 'shopName logo owner')
      .populate('items.product', 'title price images')
      .populate('couponUsed', 'code discountType discountValue');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is buyer or seller
    const isBuyer = order.buyer._id.toString() === userId.toString();
    const isSeller = order.shop.owner.toString() === userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

// Update order status (seller only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.user._id;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId).populate('shop');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is seller of this shop
    if (order.shop.owner.toString() !== sellerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
};

// Cancel order (buyer or seller)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId).populate('shop');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isBuyer = order.buyer.toString() === userId.toString();
    const isSeller = order.shop.owner.toString() === userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};
