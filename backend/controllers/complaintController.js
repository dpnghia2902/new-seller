const Complaint = require('../models/Complaint');
const mongoose = require('mongoose');

// GET /api/complaints
// Query: shop, status, type, orderCode, startDate, endDate, page, limit, sort
exports.listComplaints = async (req, res, next) => {
  try {
    const {
      shop,
      status,
      type,
      orderCode,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (shop && mongoose.Types.ObjectId.isValid(shop)) {
      filter.shop = shop;
    }
    if (status) {
      if (status === 'processed') {
        filter.status = { $ne: 'new' };
      } else {
        filter.status = status;
      }
    }
    if (type) {
      filter.type = type;
    }
    if (orderCode) {
      filter.orderCode = { $regex: orderCode, $options: 'i' };
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // include the entire end day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Complaint.find(filter)
        .populate('order', '_id status createdAt')
        .populate('product', '_id title')
        .populate('buyer', '_id fullName email')
        .populate('shop', '_id shopName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
      appliedFilter: filter,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/complaints/:id/evidence
exports.uploadSellerEvidence = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const files = req.files || [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = files.map((f) => `${baseUrl}/uploads/${f.filename}`);

    complaint.sellerEvidence = [...(complaint.sellerEvidence || []), ...urls];
    await complaint.save();

    res.json({ urls });
  } catch (err) {
    next(err);
  }
};

// GET /api/complaints/:id
exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('order')
      .populate('product', '_id title images')
      .populate('buyer', '_id fullName email')
      .populate('shop', '_id shopName');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/complaints/:id/action
// body: { action: 'refund'|'replace'|'reject', refundAmount?, refundPercentage?, note? }
exports.updateComplaintAction = async (req, res, next) => {
  try {
    const { action, refundAmount, refundPercentage, note, sellerEvidenceUrls } = req.body;
    if (!['refund', 'replace', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const resolution = {
      action,
      refundAmount: refundAmount ?? null,
      refundPercentage: refundPercentage ?? null,
      note: note || '',
      decidedBy: req.userId,
      decidedAt: new Date(),
    };

    // Status transition
    let status = 'in_progress';
    if (action === 'reject') status = 'disputed';
    if (action === 'refund' || action === 'replace') status = 'resolved';

    complaint.resolution = resolution;
    complaint.status = status;

    // Optional: attach seller evidence when rejecting
    if (action === 'reject' && Array.isArray(sellerEvidenceUrls)) {
      complaint.sellerEvidence = sellerEvidenceUrls.filter(Boolean);
    }

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('order')
      .populate('product', '_id title images')
      .populate('buyer', '_id fullName email')
      .populate('shop', '_id shopName');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};


