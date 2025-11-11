const express = require('express');
const router = express.Router();
const { listComplaints, getComplaintById, updateComplaintAction, uploadSellerEvidence } = require('../controllers/complaintController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer storage for evidence uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `evidence-${unique}${ext}`);
  },
});
const upload = multer({ storage });

// Seller complaint list with filters
router.get('/', protect, listComplaints);
router.get('/:id', protect, getComplaintById);
router.patch('/:id/action', protect, updateComplaintAction);
router.post('/:id/evidence', protect, upload.array('files', 10), uploadSellerEvidence);

module.exports = router;


