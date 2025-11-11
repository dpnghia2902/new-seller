const Order = require('../models/Order');
const Shop = require('../models/Shop');
const User = require('../models/User');
const logger = require('../config/logger');

// Generate tracking number
const generateTrackingNumber = () => {
  const prefix = 'TRK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Get shipping label data
exports.getShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.userId;

    // Get order with populated data
    const order = await Order.findById(orderId)
      .populate('buyer', 'fullName email phone username')
      .populate('shop', 'shopName logo owner location')
      .populate('items.product', 'title images');

    if (!order) {
      logger.warn('Shipping label requested for non-existent order', { orderId, sellerId });
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller owns this order
    if (order.shop.owner.toString() !== sellerId) {
      logger.warn('Unauthorized shipping label access attempt', { orderId, sellerId, actualOwner: order.shop.owner });
      return res.status(403).json({ message: 'Not authorized to generate label for this order' });
    }

    // Generate tracking number if not exists
    let trackingNumber = order.trackingNumber;
    if (!trackingNumber) {
      trackingNumber = generateTrackingNumber();
      order.trackingNumber = trackingNumber;
      await order.save();
    }

    // Prepare shipping label data
    const labelData = {
      trackingNumber,
      orderNumber: order._id.toString().substring(0, 8).toUpperCase(),
      orderDate: order.createdAt,
      
      // Seller info
      from: {
        shopName: order.shop.shopName,
        address: order.shop.location || 'Shop Address Not Provided',
      },
      
      // Buyer info
      to: {
        name: order.buyer.fullName || order.buyer.username,
        email: order.buyer.email,
        phone: order.buyer.phone || 'N/A',
        address: order.shippingAddress ? 
          `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}` :
          'Address Not Provided',
      },
      
      // Items
      items: order.items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      
      // Totals
      totalPrice: order.totalPrice,
      discount: order.discount || 0,
      originalPrice: order.originalPrice || order.totalPrice,
      
      // Status
      status: order.status,
      
      // Barcode data (tracking number encoded)
      barcodeData: trackingNumber,
    };

    logger.info('Shipping label generated', { orderId, trackingNumber, sellerId });

    res.json({
      success: true,
      label: labelData,
    });
  } catch (error) {
    logger.error('Generate shipping label error', { 
      error: error.message, 
      stack: error.stack,
      orderId: req.params.orderId,
      sellerId: req.userId 
    });
    res.status(500).json({ message: 'Failed to generate shipping label', error: error.message });
  }
};

// Print shipping label HTML
exports.printShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.userId;

    const order = await Order.findById(orderId)
      .populate('buyer', 'fullName email phone username')
      .populate('shop', 'shopName logo owner location')
      .populate('items.product', 'title');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.shop.owner.toString() !== sellerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let trackingNumber = order.trackingNumber;
    if (!trackingNumber) {
      trackingNumber = generateTrackingNumber();
      order.trackingNumber = trackingNumber;
      await order.save();
    }

    // Generate HTML
    const html = generateShippingLabelHTML(order, trackingNumber);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Print shipping label error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ message: 'Failed to print shipping label' });
  }
};

// HTML template for shipping label
function generateShippingLabelHTML(order, trackingNumber) {
  const orderNumber = order._id.toString().substring(0, 8).toUpperCase();
  const buyerAddress = order.shippingAddress ? 
    `${order.shippingAddress.street}<br>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>${order.shippingAddress.country}` :
    'Address Not Provided';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipping Label - ${trackingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .label-container { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #000; padding: 20px; }
    .label-header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
    .label-header h1 { font-size: 28px; margin-bottom: 5px; }
    .tracking-section { background: #000; color: white; padding: 15px; text-align: center; margin-bottom: 20px; }
    .tracking-section h2 { font-size: 32px; letter-spacing: 3px; }
    .barcode { text-align: center; padding: 20px; background: white; border: 2px dashed #000; margin-bottom: 20px; }
    .barcode-image { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
    .addresses { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    .address-box { flex: 1; border: 2px solid #000; padding: 15px; }
    .address-box h3 { font-size: 16px; margin-bottom: 10px; background: #000; color: white; padding: 8px; margin: -15px -15px 10px; }
    .address-box p { line-height: 1.6; font-size: 14px; }
    .order-info { border: 2px solid #000; padding: 15px; margin-bottom: 20px; }
    .order-info h3 { font-size: 16px; margin-bottom: 10px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .items-table th, .items-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 13px; }
    .items-table th { background: #f0f0f0; font-weight: bold; }
    .footer { text-align: center; padding-top: 20px; border-top: 2px solid #000; font-size: 12px; color: #666; }
    .print-btn { display: block; width: 200px; margin: 20px auto; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
    .print-btn:hover { background: #2563eb; }
    @media print {
      body { background: white; padding: 0; }
      .print-btn { display: none; }
      .label-container { border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print Label</button>
  
  <div class="label-container">
    <div class="label-header">
      <h1>${order.shop.shopName}</h1>
      <p>Shipping Label</p>
    </div>

    <div class="tracking-section">
      <p style="font-size: 14px; margin-bottom: 5px;">TRACKING NUMBER</p>
      <h2>${trackingNumber}</h2>
    </div>

    <div class="barcode">
      <div class="barcode-image">|||| | || ||| || | |||| |</div>
      <p style="margin-top: 10px; font-size: 12px;">${trackingNumber}</p>
    </div>

    <div class="addresses">
      <div class="address-box">
        <h3>📤 FROM (SELLER)</h3>
        <p><strong>${order.shop.shopName}</strong></p>
        <p>${order.shop.location || 'Address Not Provided'}</p>
      </div>

      <div class="address-box">
        <h3>📥 TO (BUYER)</h3>
        <p><strong>${order.buyer.fullName || order.buyer.username}</strong></p>
        <p>${buyerAddress}</p>
        <p>Phone: ${order.buyer.phone || 'N/A'}</p>
      </div>
    </div>

    <div class="order-info">
      <h3>📦 Order Details</h3>
      <p><strong>Order #:</strong> ${orderNumber}</p>
      <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.title}</td>
              <td>${item.quantity}</td>
              <td>$${item.price.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr style="background: #f9f9f9; font-weight: bold;">
            <td colspan="2">TOTAL</td>
            <td>$${order.totalPrice.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p>Please handle with care • Keep this label visible during shipping</p>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ Print Label</button>
</body>
</html>
  `;
}

module.exports = {
  getShippingLabel: exports.getShippingLabel,
  printShippingLabel: exports.printShippingLabel,
};
