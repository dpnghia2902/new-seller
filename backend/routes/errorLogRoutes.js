const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const errorLogController = require('../controllers/errorLogController');

// Admin only routes
router.get('/', protect, restrictTo('admin'), errorLogController.getErrorLogs);
router.get('/stats/context', protect, restrictTo('admin'), errorLogController.getErrorStatsByContext);
router.get('/stats/timeline', protect, restrictTo('admin'), errorLogController.getErrorTimeline);
router.get('/:id', protect, restrictTo('admin'), errorLogController.getErrorLog);
router.put('/:id/resolve', protect, restrictTo('admin'), errorLogController.resolveErrorLog);
router.delete('/bulk', protect, restrictTo('admin'), errorLogController.deleteErrorLogs);

module.exports = router;
