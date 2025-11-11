const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();
// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = initSocket(server);

// Nếu bạn vẫn muốn lấy io từ req.app.get('io'):
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'eBay Clone API with Socket.IO' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for connections`);
});