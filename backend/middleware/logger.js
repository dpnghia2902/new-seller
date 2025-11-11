const logger = require('../config/logger');
const ErrorLog = require('../models/ErrorLog');

// Middleware to log all requests
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  req.startTime = startTime;

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
const errorLogger = async (err, req, res, next) => {
  const duration = req.startTime ? Date.now() - req.startTime : 0;
  
  // Determine context from URL
  let context = 'general';
  if (req.url.includes('/auth')) context = 'auth';
  else if (req.url.includes('/product')) context = 'product';
  else if (req.url.includes('/order')) context = 'order';
  else if (req.url.includes('/shop')) context = 'shop';
  else if (req.url.includes('/coupon')) context = 'coupon';
  else if (req.url.includes('/verification')) context = 'verification';
  else if (req.url.includes('/shipping')) context = 'shipping';

  // Determine operation from method and URL
  const operation = `${req.method.toLowerCase()}_${req.url.split('/').filter(Boolean).slice(1, 3).join('_')}`;

  // Log to Winston
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.userId || 'anonymous',
    context,
    operation,
  });

  // Save to database for admin viewing
  try {
    const sanitizedHeaders = { ...req.headers };
    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders.cookie;

    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';

    await ErrorLog.create({
      level: err.statusCode >= 500 ? 'error' : 'warn',
      errorCode: err.code || 'UNKNOWN_ERROR',
      message: err.message,
      stack: err.stack,
      context,
      operation,
      userId: req.userId || null,
      userRole: req.user?.role || 'guest',
      requestDetails: {
        method: req.method,
        url: req.url,
        params: req.params,
        body: sanitizedBody,
        query: req.query,
        headers: sanitizedHeaders,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      responseDetails: {
        statusCode: err.statusCode || 500,
        responseTime: duration,
      },
      metadata: {
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (dbError) {
    logger.error('Failed to save error log to database', {
      error: dbError.message,
      originalError: err.message,
    });
  }

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

// Helper function to log operation (success or failure)
const logOperation = async (context, operation, userId, details = {}, level = 'info') => {
  logger[level]('Operation logged', {
    context,
    operation,
    userId,
    ...details,
    timestamp: new Date().toISOString(),
  });

  // For important operations, also save to database
  if (['product', 'order', 'shop', 'verification'].includes(context)) {
    try {
      await ErrorLog.create({
        level,
        errorCode: `${context.toUpperCase()}_${operation.toUpperCase()}`,
        message: details.message || `${operation} operation in ${context}`,
        context,
        operation,
        userId: userId || null,
        metadata: details,
        resolved: level === 'info', // Auto-resolve info logs
      });
    } catch (err) {
      logger.warn('Failed to save operation log', { error: err.message });
    }
  }
};

module.exports = {
  requestLogger,
  errorLogger,
  logUserAction,
  logSocketEvent,
  logOperation,
};
