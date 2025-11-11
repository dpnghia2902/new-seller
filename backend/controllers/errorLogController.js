const ErrorLog = require('../models/ErrorLog');
const logger = require('../config/logger');

// Get all error logs with filters
exports.getErrorLogs = async (req, res) => {
  try {
    const {
      level,
      context,
      resolved,
      userId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter
    const filter = {};
    
    if (level) filter.level = level;
    if (context) filter.context = context;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (userId) filter.userId = userId;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { errorCode: { $regex: search, $options: 'i' } },
        { operation: { $regex: search, $options: 'i' } },
      ];
    }

    // Get logs
    const logs = await ErrorLog.find(filter)
      .populate('userId', 'username email role')
      .populate('resolvedBy', 'username email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ErrorLog.countDocuments(filter);

    // Get statistics
    const stats = await ErrorLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalErrors: { $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] } },
          totalWarnings: { $sum: { $cond: [{ $eq: ['$level', 'warn'] }, 1, 0] } },
          resolved: { $sum: { $cond: ['$resolved', 1, 0] } },
          unresolved: { $sum: { $cond: ['$resolved', 0, 1] } },
        },
      },
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
      stats: stats[0] || { totalErrors: 0, totalWarnings: 0, resolved: 0, unresolved: 0 },
    });
  } catch (error) {
    logger.error('Get error logs failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch error logs', error: error.message });
  }
};

// Get single error log
exports.getErrorLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await ErrorLog.findById(id)
      .populate('userId', 'username email role fullName')
      .populate('resolvedBy', 'username email');

    if (!log) {
      return res.status(404).json({ message: 'Error log not found' });
    }

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    logger.error('Get error log failed', { error: error.message, logId: req.params.id });
    res.status(500).json({ message: 'Failed to fetch error log', error: error.message });
  }
};

// Mark error log as resolved
exports.resolveErrorLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.userId;

    const log = await ErrorLog.findByIdAndUpdate(
      id,
      {
        resolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        notes: notes || log.notes,
      },
      { new: true }
    ).populate('resolvedBy', 'username email');

    if (!log) {
      return res.status(404).json({ message: 'Error log not found' });
    }

    logger.info('Error log resolved', { logId: id, resolvedBy: adminId });

    res.json({
      success: true,
      message: 'Error log marked as resolved',
      log,
    });
  } catch (error) {
    logger.error('Resolve error log failed', { error: error.message, logId: req.params.id });
    res.status(500).json({ message: 'Failed to resolve error log', error: error.message });
  }
};

// Delete error logs
exports.deleteErrorLogs = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide log IDs to delete' });
    }

    const result = await ErrorLog.deleteMany({ _id: { $in: ids } });

    logger.info('Error logs deleted', { count: result.deletedCount, deletedBy: req.userId });

    res.json({
      success: true,
      message: `${result.deletedCount} error log(s) deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error('Delete error logs failed', { error: error.message });
    res.status(500).json({ message: 'Failed to delete error logs', error: error.message });
  }
};

// Get error statistics by context
exports.getErrorStatsByContext = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await ErrorLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$context',
          count: { $sum: 1 },
          errors: { $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] } },
          warnings: { $sum: { $cond: [{ $eq: ['$level', 'warn'] }, 1, 0] } },
          resolved: { $sum: { $cond: ['$resolved', 1, 0] } },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      success: true,
      stats,
      period: `Last ${days} days`,
    });
  } catch (error) {
    logger.error('Get error stats failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch error statistics', error: error.message });
  }
};

// Get error timeline
exports.getErrorTimeline = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const timeline = await ErrorLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            level: '$level',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    // Format timeline data
    const formattedTimeline = {};
    timeline.forEach((item) => {
      const date = item._id.date;
      if (!formattedTimeline[date]) {
        formattedTimeline[date] = { date, error: 0, warn: 0, info: 0 };
      }
      formattedTimeline[date][item._id.level] = item.count;
    });

    res.json({
      success: true,
      timeline: Object.values(formattedTimeline),
      period: `Last ${days} days`,
    });
  } catch (error) {
    logger.error('Get error timeline failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch error timeline', error: error.message });
  }
};

module.exports = {
  getErrorLogs: exports.getErrorLogs,
  getErrorLog: exports.getErrorLog,
  resolveErrorLog: exports.resolveErrorLog,
  deleteErrorLogs: exports.deleteErrorLogs,
  getErrorStatsByContext: exports.getErrorStatsByContext,
  getErrorTimeline: exports.getErrorTimeline,
};
