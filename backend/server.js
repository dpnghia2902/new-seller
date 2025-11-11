const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { requestLogger, errorLogger } = require('./middleware/logger');

// Connect to database
connectDB().catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

const app = express();
// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = initSocket(server);

// Nếu bạn vẫn muốn lấy io từ req.app.get('io'):
app.set('io', io);

// HTTP request logger (Morgan + Winston)
app.use(morgan('combined', { stream: logger.stream }));

// Custom request logger
app.use(requestLogger);

// Apply general API rate limiter to all routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/verification', require('./routes/verificationRoutes'));
app.use('/api/shipping', require('./routes/shippingRoutes'));
app.use('/api/error-logs', require('./routes/errorLogRoutes'));
// Static serve uploads
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'eBay Clone API with Socket.IO' });
});

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for connections`);
});
