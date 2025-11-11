const express = require('express');
const cors = require('cors');
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

// HTTP request logger (Morgan + Winston)
app.use(morgan('combined', { stream: logger.stream }));

// Custom request logger
app.use(requestLogger);

// Apply general API rate limiter to all routes
app.use('/api/', apiLimiter);

// Routes
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/shops', require('./routes/shopRoutes'));
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/coupons', require('./routes/couponRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/verification', require('./routes/verificationRoutes'));
  app.use('/api/shipping', require('./routes/shippingRoutes'));
  app.use('/api/error-logs', require('./routes/errorLogRoutes'));
} catch (error) {
  console.error('Error loading routes:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'eBay Clone API' });
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

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

// Initialize Socket.IO
const { initializeSocket } = require('./config/socket');
initializeSocket(server);
