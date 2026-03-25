const path = require('path');

/**
 * Express error handling middleware
 * Must be last middleware in app.use() chain
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (don't log in production sensitive data)
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?._id || 'anonymous'
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    // JWT errors
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  if (err.name === 'CastError') {
    // Invalid ObjectId
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID'
    });
  }

  if (err.code === 11000) {
    // MongoDB duplicate key
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // Default response for other errors
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
};

/**
 * 404 handler for unmatched routes (use before errorHandler)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
