const logger = require('../config/logger');

// Middleware to log all requests
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.userId || 'anonymous',
  });

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous',
    });

    return originalJson.call(this, data);
  };

  next();
};

// Middleware to log errors
const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.userId || 'anonymous',
    body: req.body,
  });

  next(err);
};

// Helper function to log user actions
const logUserAction = (action, userId, details = {}) => {
  logger.info('User action', {
    action,
    userId,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Helper function to log socket events
const logSocketEvent = (event, socketId, data = {}) => {
  logger.info('Socket event', {
    event,
    socketId,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  requestLogger,
  errorLogger,
  logUserAction,
  logSocketEvent,
};
