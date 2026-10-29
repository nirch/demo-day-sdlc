const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  logger.error({
    message: err.message,
    status,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({ data: null, error: message });
};

module.exports = errorHandler;
