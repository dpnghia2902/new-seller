const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Rate limiter for product creation - 5 requests per 15 minutes
const productCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    message: 'Too many products created from this account. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use userId as key, with IPv6-safe IP fallback
  keyGenerator: (req) => {
    return req.userId || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many products created from this account. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    });
  },
});

// Rate limiter for shop creation - 3 requests per hour
const shopCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: {
    message: 'Too many shop creation attempts. Please try again after 1 hour.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many shop creation attempts. Please try again after 1 hour.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    });
  },
});

// Rate limiter for order creation - 10 requests per 10 minutes
const orderCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    message: 'Too many orders created. Please try again after 10 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many orders created. Please try again after 10 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '10 minutes',
    });
  },
});

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000,
  message: {
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    });
  },
});

// Auth rate limiter - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    });
  },
});

module.exports = {
  productCreateLimiter,
  shopCreateLimiter,
  orderCreateLimiter,
  apiLimiter,
  authLimiter,
};
