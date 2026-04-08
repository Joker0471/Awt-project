/**
 * Global error handler — must be last middleware in Express chain.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`;
    statusCode = 409;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message    = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path} →`, err);
  }

  res.status(statusCode).json({ success: false, message });
};

/**
 * 404 handler — must be placed BEFORE errorHandler, AFTER all routes.
 */
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
