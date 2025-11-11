const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('./logger');
const { logSocketEvent } = require('../middleware/logger');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        logger.warn('Socket connection attempt without token', { socketId: socket.id });
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        logger.warn('Socket connection attempt with invalid user', { socketId: socket.id });
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      
      logger.info('Socket authenticated', {
        socketId: socket.id,
        userId: user._id,
        username: user.username,
      });

      next();
    } catch (error) {
      logger.error('Socket authentication error', { 
        error: error.message,
        socketId: socket.id,
      });
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Client connected', {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.user?.username,
    });

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);
    logSocketEvent('user-joined-personal-room', socket.id, { userId: socket.userId });

    // If user is a seller, join them to their shop room
    if (socket.user.storeId) {
      const shopRoom = `shop-${socket.user.storeId}`;
      socket.join(shopRoom);
      logSocketEvent('seller-joined-shop-room', socket.id, { 
        shopId: socket.user.storeId,
        userId: socket.userId,
      });
      
      logger.info('Seller joined shop room', {
        socketId: socket.id,
        userId: socket.userId,
        shopId: socket.user.storeId,
      });
    }

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });
      logSocketEvent('user-disconnected', socket.id, { userId: socket.userId, reason });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    });

    // Ping-pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  logger.info('Socket.IO initialized successfully');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper function to emit to a specific user
const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user-${userId}`).emit(event, data);
    logSocketEvent(`emit-to-user-${event}`, 'server', { userId, data });
  } catch (error) {
    logger.error('Error emitting to user', {
      error: error.message,
      userId,
      event,
    });
  }
};

// Helper function to emit to a shop (all sellers of that shop)
const emitToShop = (shopId, event, data) => {
  try {
    const io = getIO();
    io.to(`shop-${shopId}`).emit(event, data);
    logSocketEvent(`emit-to-shop-${event}`, 'server', { shopId, data });
  } catch (error) {
    logger.error('Error emitting to shop', {
      error: error.message,
      shopId,
      event,
    });
  }
};

// Helper function to emit to all connected clients
const emitToAll = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
    logSocketEvent(`emit-to-all-${event}`, 'server', { data });
  } catch (error) {
    logger.error('Error emitting to all', {
      error: error.message,
      event,
    });
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToShop,
  emitToAll,
};
